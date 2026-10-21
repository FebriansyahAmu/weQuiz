import "server-only";
import { getPreset } from "@/config/exam-presets";
import type { SaveAnswerInput, StartExamInput } from "@/lib/validation/exam";
import {
  findAttemptQuestionForAnswer,
  findAttemptResult,
  findAttemptReview,
  findAttemptSession,
  findAttemptStatus,
  findGradingRows,
  insertAttempt,
  markAttemptFinished,
  runInTransaction,
  saveGrades,
  updateAnswerIfInProgress,
} from "@/server/dal/attempts.dal";
import { findActiveQuestionPool } from "@/server/dal/questions.dal";
import { AppError, attemptNotFound } from "@/server/errors";
import { InsufficientQuestionsError, pickQuestions } from "@/server/services/question-picker";
import { gradeItems, summarize } from "@/server/services/scoring";
import type {
  AttemptResultDTO,
  AttemptReviewDTO,
  AttemptSessionDTO,
  SaveAnswerResultDTO,
} from "@/types/dto";

/** Tolerates network latency on the last autosave before the deadline. */
const EXPIRY_GRACE_MS = 5_000;

function isExpired(expiresAt: Date | null, now: Date) {
  return expiresAt !== null && now.getTime() > expiresAt.getTime() + EXPIRY_GRACE_MS;
}

export async function startAttempt(input: StartExamInput): Promise<{ attemptId: string }> {
  const preset = getPreset(input.presetKey);
  if (!preset) throw new AppError("UNKNOWN_PRESET", "Paket ujian tidak dikenal.");

  const pool = await findActiveQuestionPool(preset.levels);

  let picked;
  try {
    picked = pickQuestions(pool, preset.composition);
  } catch (error) {
    if (error instanceof InsufficientQuestionsError) {
      throw new AppError("INSUFFICIENT_QUESTIONS", "Bank soal belum cukup untuk paket ini.", undefined, {
        cause: error,
      });
    }
    throw error;
  }

  const expiresAt = preset.durationMinutes ? new Date(Date.now() + preset.durationMinutes * 60_000) : null;
  const attemptId = await insertAttempt({
    participantName: input.name,
    presetKey: preset.key,
    expiresAt,
    questionIds: picked.map((q) => q.id),
  });
  return { attemptId };
}

/**
 * Grades and locks an attempt in one transaction. The status flip happens
 * first, so concurrent submits grade only once and later autosaves are rejected.
 */
async function finalizeAttempt(id: string, status: "SUBMITTED" | "EXPIRED", now: Date) {
  await runInTransaction(async (tx) => {
    const locked = await markAttemptFinished(tx, id, status, now);
    if (!locked) return;

    const rows = await findGradingRows(tx, id);
    const { results, summary } = gradeItems(
      rows.map((row) => ({
        type: row.question.type,
        selectedOptionIds: row.selectedOptionIds,
        correctOptionIds: row.question.options.map((o) => o.id),
      })),
    );

    await saveGrades(tx, id, {
      correctCount: summary.correct,
      wrongCount: summary.wrong,
      unansweredCount: summary.unanswered,
      score: summary.score,
      correctIds: rows.filter((_, i) => results[i]).map((r) => r.id),
      incorrectIds: rows.filter((_, i) => !results[i]).map((r) => r.id),
    });
  });
}

/** Finalizes an attempt whose deadline passed; returns whether it is finished now. */
async function ensureFinishedIfExpired(attempt: { id: string; status: string; expiresAt: Date | null }) {
  if (attempt.status !== "IN_PROGRESS") return true;
  const now = new Date();
  if (!isExpired(attempt.expiresAt, now)) return false;
  await finalizeAttempt(attempt.id, "EXPIRED", now);
  return true;
}

export async function getAttemptSession(id: string): Promise<AttemptSessionDTO> {
  const status = await findAttemptStatus(id);
  if (!status) throw attemptNotFound();
  await ensureFinishedIfExpired(status);

  const attempt = await findAttemptSession(id);
  if (!attempt) throw attemptNotFound();

  const remainingSeconds =
    attempt.status === "IN_PROGRESS" && attempt.expiresAt
      ? Math.max(0, Math.floor((attempt.expiresAt.getTime() - Date.now()) / 1000))
      : null;

  return {
    id: attempt.id,
    participantName: attempt.participantName,
    presetKey: attempt.presetKey,
    status: attempt.status,
    startedAt: attempt.startedAt.toISOString(),
    expiresAt: attempt.expiresAt?.toISOString() ?? null,
    remainingSeconds,
    questions: attempt.questions.map(({ position, question }) => ({ ...question, position })),
    answers: attempt.questions.map(({ question, selectedOptionIds, flagged }) => ({
      questionId: question.id,
      selectedOptionIds,
      flagged,
    })),
  };
}

export async function saveAnswer(attemptId: string, input: SaveAnswerInput): Promise<SaveAnswerResultDTO> {
  const target = await findAttemptQuestionForAnswer(attemptId, input.questionId);
  if (!target) {
    if (!(await findAttemptStatus(attemptId))) throw attemptNotFound();
    throw new AppError("QUESTION_NOT_IN_ATTEMPT", "Soal tidak termasuk dalam sesi ujian ini.");
  }

  const locked = () => new AppError("ATTEMPT_LOCKED", "Ujian sudah dikumpulkan. Jawaban tidak dapat diubah.");
  if (target.attempt.status !== "IN_PROGRESS") throw locked();

  const now = new Date();
  if (isExpired(target.attempt.expiresAt, now)) {
    await finalizeAttempt(attemptId, "EXPIRED", now);
    throw new AppError("TIME_EXPIRED", "Waktu ujian sudah habis. Jawaban Anda telah dikumpulkan otomatis.");
  }

  const selected = [...new Set(input.selectedOptionIds)];
  const validIds = new Set(target.question.options.map((o) => o.id));
  if (selected.some((id) => !validIds.has(id))) {
    throw new AppError("INVALID_ANSWER", "Pilihan jawaban tidak valid untuk soal ini.");
  }
  if (target.question.type !== "MULTIPLE" && selected.length > 1) {
    throw new AppError("INVALID_ANSWER", "Soal ini hanya boleh memiliki satu jawaban.");
  }

  const saved = await updateAnswerIfInProgress(target.id, {
    selectedOptionIds: selected,
    flagged: input.flagged ?? target.flagged,
    answeredAt: selected.length > 0 ? now : null,
  });
  if (!saved) throw locked();

  return { savedAt: now.toISOString() };
}

export async function submitAttempt(id: string): Promise<AttemptResultDTO> {
  const status = await findAttemptStatus(id);
  if (!status) throw attemptNotFound();

  if (status.status === "IN_PROGRESS") {
    const now = new Date();
    await finalizeAttempt(id, isExpired(status.expiresAt, now) ? "EXPIRED" : "SUBMITTED", now);
  }
  return getAttemptResult(id);
}

async function requireFinished(id: string) {
  const status = await findAttemptStatus(id);
  if (!status) throw attemptNotFound();
  if (!(await ensureFinishedIfExpired(status))) {
    throw new AppError("ATTEMPT_NOT_FINISHED", "Ujian belum dikumpulkan.");
  }
}

export async function getAttemptResult(id: string): Promise<AttemptResultDTO> {
  await requireFinished(id);
  const attempt = await findAttemptResult(id);
  if (!attempt || attempt.status === "IN_PROGRESS" || !attempt.submittedAt) throw attemptNotFound();

  const { byType } = summarize(
    attempt.questions.map((q) => ({
      type: q.question.type,
      answered: q.selectedOptionIds.length > 0,
      isCorrect: q.isCorrect === true,
    })),
  );

  // An expired attempt may be finalized long after its deadline; cap the duration there.
  const endedAt =
    attempt.expiresAt && attempt.expiresAt < attempt.submittedAt ? attempt.expiresAt : attempt.submittedAt;

  return {
    id: attempt.id,
    participantName: attempt.participantName,
    presetKey: attempt.presetKey,
    status: attempt.status,
    startedAt: attempt.startedAt.toISOString(),
    submittedAt: attempt.submittedAt.toISOString(),
    durationSeconds: Math.max(0, Math.round((endedAt.getTime() - attempt.startedAt.getTime()) / 1000)),
    total: attempt.totalQuestions,
    correct: attempt.correctCount ?? 0,
    wrong: attempt.wrongCount ?? 0,
    unanswered: attempt.unansweredCount ?? 0,
    score: attempt.score?.toNumber() ?? 0,
    byType,
  };
}

export async function getAttemptReview(id: string): Promise<AttemptReviewDTO> {
  await requireFinished(id);
  const attempt = await findAttemptReview(id);
  if (!attempt || attempt.status === "IN_PROGRESS") throw attemptNotFound();

  return {
    attemptId: attempt.id,
    participantName: attempt.participantName,
    status: attempt.status,
    score: attempt.score?.toNumber() ?? 0,
    questions: attempt.questions.map(({ position, selectedOptionIds, flagged, isCorrect, question }) => ({
      ...question,
      position,
      selectedOptionIds,
      flagged,
      isCorrect: isCorrect === true,
    })),
  };
}
