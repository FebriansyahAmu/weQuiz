import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";

type DbClient = typeof db | Prisma.TransactionClient;

/** Question fields safe to show during an exam — deliberately excludes `isCorrect`. */
const publicQuestionSelect = {
  id: true,
  type: true,
  level: true,
  text: true,
  textZh: true,
  options: {
    select: { id: true, label: true, text: true, textZh: true },
    orderBy: { order: "asc" },
  },
} as const satisfies Prisma.QuestionSelect;

export function runInTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
  return db.$transaction(fn, { timeout: 15_000 });
}

export async function insertAttempt(data: {
  participantName: string;
  presetKey: string;
  expiresAt: Date | null;
  questionIds: string[];
}) {
  const attempt = await db.attempt.create({
    data: {
      participantName: data.participantName,
      presetKey: data.presetKey,
      expiresAt: data.expiresAt,
      totalQuestions: data.questionIds.length,
      questions: {
        createMany: { data: data.questionIds.map((questionId, position) => ({ questionId, position })) },
      },
    },
    select: { id: true },
  });
  return attempt.id;
}

export function findAttemptStatus(id: string) {
  return db.attempt.findUnique({ where: { id }, select: { id: true, status: true, expiresAt: true } });
}

export function findAttemptSession(id: string) {
  return db.attempt.findUnique({
    where: { id },
    select: {
      id: true,
      participantName: true,
      presetKey: true,
      status: true,
      startedAt: true,
      expiresAt: true,
      questions: {
        orderBy: { position: "asc" },
        select: {
          position: true,
          selectedOptionIds: true,
          flagged: true,
          question: { select: publicQuestionSelect },
        },
      },
    },
  });
}

export function findAttemptQuestionForAnswer(attemptId: string, questionId: string) {
  return db.attemptQuestion.findUnique({
    where: { attemptId_questionId: { attemptId, questionId } },
    select: {
      id: true,
      flagged: true,
      attempt: { select: { status: true, expiresAt: true } },
      question: { select: { type: true, options: { select: { id: true } } } },
    },
  });
}

/** Writes an answer only while the attempt is still in progress. Returns false if it was locked. */
export async function updateAnswerIfInProgress(
  attemptQuestionId: string,
  data: { selectedOptionIds: string[]; flagged: boolean; answeredAt: Date | null },
) {
  const { count } = await db.attemptQuestion.updateMany({
    where: { id: attemptQuestionId, attempt: { status: "IN_PROGRESS" } },
    data,
  });
  return count === 1;
}

/**
 * Flips an in-progress attempt to a finished status. Returns false when another
 * request already finished it (the conditional update makes submit idempotent).
 */
export async function markAttemptFinished(
  tx: DbClient,
  id: string,
  status: "SUBMITTED" | "EXPIRED",
  submittedAt: Date,
) {
  const { count } = await tx.attempt.updateMany({
    where: { id, status: "IN_PROGRESS" },
    data: { status, submittedAt },
  });
  return count === 1;
}

export function findGradingRows(tx: DbClient, attemptId: string) {
  return tx.attemptQuestion.findMany({
    where: { attemptId },
    select: {
      id: true,
      selectedOptionIds: true,
      question: { select: { type: true, options: { where: { isCorrect: true }, select: { id: true } } } },
    },
  });
}

export async function saveGrades(
  tx: DbClient,
  attemptId: string,
  grades: {
    correctCount: number;
    wrongCount: number;
    unansweredCount: number;
    score: number;
    correctIds: string[];
    incorrectIds: string[];
  },
) {
  const { correctIds, incorrectIds, ...counts } = grades;
  await tx.attempt.update({ where: { id: attemptId }, data: counts });
  if (correctIds.length > 0) {
    await tx.attemptQuestion.updateMany({ where: { id: { in: correctIds } }, data: { isCorrect: true } });
  }
  if (incorrectIds.length > 0) {
    await tx.attemptQuestion.updateMany({ where: { id: { in: incorrectIds } }, data: { isCorrect: false } });
  }
}

export function findAttemptResult(id: string) {
  return db.attempt.findUnique({
    where: { id },
    select: {
      id: true,
      participantName: true,
      presetKey: true,
      status: true,
      startedAt: true,
      expiresAt: true,
      submittedAt: true,
      totalQuestions: true,
      correctCount: true,
      wrongCount: true,
      unansweredCount: true,
      score: true,
      questions: { select: { isCorrect: true, selectedOptionIds: true, question: { select: { type: true } } } },
    },
  });
}

/** Includes answer keys — callers must only use it for finished attempts. */
export function findAttemptReview(id: string) {
  return db.attempt.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      participantName: true,
      score: true,
      questions: {
        orderBy: { position: "asc" },
        select: {
          position: true,
          selectedOptionIds: true,
          flagged: true,
          isCorrect: true,
          question: {
            select: {
              ...publicQuestionSelect,
              options: {
                select: { id: true, label: true, text: true, textZh: true, isCorrect: true },
                orderBy: { order: "asc" },
              },
            },
          },
        },
      },
    },
  });
}
