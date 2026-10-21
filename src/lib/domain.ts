/**
 * Domain constants shared by the seed, server and UI. Values mirror the Prisma
 * enums but stay importable from client components (no generated client import).
 */

export const OPTION_LABELS = ["A", "B", "C", "D", "E"] as const;
export type OptionLabel = (typeof OPTION_LABELS)[number];

/** Display/grading order of the exam sections. */
export const QUESTION_TYPES = ["SINGLE", "MULTIPLE", "TRUE_FALSE"] as const;
export type QuestionTypeValue = (typeof QUESTION_TYPES)[number];

export const QUESTION_LEVELS = ["LV1", "LV2", "LV3", "GENERAL"] as const;
export type QuestionLevelValue = (typeof QUESTION_LEVELS)[number];

export const ATTEMPT_STATUSES = ["IN_PROGRESS", "SUBMITTED", "EXPIRED"] as const;
export type AttemptStatusValue = (typeof ATTEMPT_STATUSES)[number];

export const QUESTION_TYPE_LABEL: Record<QuestionTypeValue, string> = {
  SINGLE: "Pilihan Tunggal",
  MULTIPLE: "Multi Jawaban",
  TRUE_FALSE: "Benar / Salah",
};

export const QUESTION_LEVEL_LABEL: Record<QuestionLevelValue, string> = {
  LV1: "Level 1",
  LV2: "Level 2",
  LV3: "Level 3",
  GENERAL: "Umum",
};
