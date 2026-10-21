import type { QuestionLevelValue, QuestionTypeValue } from "@/lib/domain";

/** Number of questions per type, or every active question in the pool. */
export type Composition = Record<QuestionTypeValue, number> | "ALL";

export interface ExamPreset {
  key: string;
  label: string;
  description: string;
  composition: Composition;
  /** null = all levels. Level presets include GENERAL (K3/company rules) questions. */
  levels: readonly QuestionLevelValue[] | null;
  /** null = no time limit. */
  durationMinutes: number | null;
}

export const EXAM_PRESETS = [
  {
    key: "standar",
    label: "Standar",
    description: "50 soal acak dari semua level",
    composition: { SINGLE: 25, MULTIPLE: 15, TRUE_FALSE: 10 },
    levels: null,
    durationMinutes: 60,
  },
  {
    key: "lv1",
    label: "Level 1",
    description: "50 soal Level 1 + materi umum",
    composition: { SINGLE: 25, MULTIPLE: 15, TRUE_FALSE: 10 },
    levels: ["LV1", "GENERAL"],
    durationMinutes: 60,
  },
  {
    key: "lv2",
    label: "Level 2",
    description: "50 soal Level 2 + materi umum",
    composition: { SINGLE: 25, MULTIPLE: 15, TRUE_FALSE: 10 },
    levels: ["LV2", "GENERAL"],
    durationMinutes: 60,
  },
  {
    // Level 3 has no multi-answer or true/false questions of its own, so those
    // sections come from GENERAL only (12 each available).
    key: "lv3",
    label: "Level 3",
    description: "50 soal Level 3 + materi umum",
    composition: { SINGLE: 30, MULTIPLE: 10, TRUE_FALSE: 10 },
    levels: ["LV3", "GENERAL"],
    durationMinutes: 60,
  },
  {
    key: "lengkap",
    label: "Lengkap",
    description: "Seluruh bank soal, tanpa batas waktu",
    composition: "ALL",
    levels: null,
    durationMinutes: null,
  },
] as const satisfies readonly ExamPreset[];

export type ExamPresetKey = (typeof EXAM_PRESETS)[number]["key"];

export const DEFAULT_PRESET_KEY: ExamPresetKey = "standar";

export const PRESET_KEYS = EXAM_PRESETS.map((p) => p.key) as [ExamPresetKey, ...ExamPresetKey[]];

export function getPreset(key: string): ExamPreset | undefined {
  return EXAM_PRESETS.find((p) => p.key === key);
}
