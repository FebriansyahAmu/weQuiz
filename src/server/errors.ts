import type { ApiErrorCode } from "@/types/dto";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNKNOWN_PRESET: 400,
  INVALID_ANSWER: 400,
  ATTEMPT_NOT_FOUND: 404,
  QUESTION_NOT_IN_ATTEMPT: 404,
  ATTEMPT_LOCKED: 409,
  TIME_EXPIRED: 409,
  ATTEMPT_NOT_FINISHED: 409,
  INSUFFICIENT_QUESTIONS: 500,
  INTERNAL_ERROR: 500,
};

/** Expected domain failure. `message` is user-facing (Bahasa Indonesia). */
export class AppError extends Error {
  readonly status: number;

  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly details?: unknown,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "AppError";
    this.status = STATUS_BY_CODE[code];
  }
}

export const attemptNotFound = () => new AppError("ATTEMPT_NOT_FOUND", "Sesi ujian tidak ditemukan.");
