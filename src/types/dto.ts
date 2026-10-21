import type { AttemptStatusValue, QuestionLevelValue, QuestionTypeValue } from "@/lib/domain";

/**
 * Data shapes that cross the server → client boundary (API responses and
 * Server Component props). Dates are ISO strings so they serialize as-is.
 *
 * Public* types never carry answer keys; Review* types are only produced for
 * finished attempts.
 */

export interface PublicOptionDTO {
  id: string;
  label: string;
  text: string;
  textZh: string | null;
}

export interface PublicQuestionDTO {
  id: string;
  position: number;
  type: QuestionTypeValue;
  level: QuestionLevelValue;
  text: string;
  textZh: string | null;
  options: PublicOptionDTO[];
}

export interface AnswerStateDTO {
  questionId: string;
  selectedOptionIds: string[];
  flagged: boolean;
}

export interface AttemptSessionDTO {
  id: string;
  participantName: string;
  presetKey: string;
  status: AttemptStatusValue;
  startedAt: string;
  expiresAt: string | null;
  /** Seconds left, computed on the server to avoid client clock skew. null = no limit. */
  remainingSeconds: number | null;
  questions: PublicQuestionDTO[];
  answers: AnswerStateDTO[];
}

export interface SaveAnswerResultDTO {
  savedAt: string;
}

export interface TallyDTO {
  total: number;
  correct: number;
  wrong: number;
  unanswered: number;
}

export interface AttemptResultDTO extends TallyDTO {
  id: string;
  participantName: string;
  presetKey: string;
  status: Exclude<AttemptStatusValue, "IN_PROGRESS">;
  startedAt: string;
  submittedAt: string;
  durationSeconds: number;
  /** Percentage 0–100 with two decimals. */
  score: number;
  byType: Record<QuestionTypeValue, TallyDTO>;
}

export interface ReviewOptionDTO extends PublicOptionDTO {
  isCorrect: boolean;
}

export interface ReviewQuestionDTO extends Omit<PublicQuestionDTO, "options"> {
  options: ReviewOptionDTO[];
  selectedOptionIds: string[];
  flagged: boolean;
  isCorrect: boolean;
}

export interface AttemptReviewDTO {
  attemptId: string;
  participantName: string;
  status: Exclude<AttemptStatusValue, "IN_PROGRESS">;
  score: number;
  questions: ReviewQuestionDTO[];
}

export const API_ERROR_CODES = [
  "VALIDATION_ERROR",
  "UNKNOWN_PRESET",
  "INVALID_ANSWER",
  "ATTEMPT_NOT_FOUND",
  "QUESTION_NOT_IN_ATTEMPT",
  "ATTEMPT_LOCKED",
  "TIME_EXPIRED",
  "ATTEMPT_NOT_FINISHED",
  "INSUFFICIENT_QUESTIONS",
  "INTERNAL_ERROR",
] as const;
export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export interface ApiErrorBody {
  error: { code: ApiErrorCode; message: string; details?: unknown };
}
