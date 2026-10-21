import { z } from "zod";

/**
 * Question bank source format (prisma/seed/data/*.json) and its normalization
 * into database-ready records. Pure module: shared by the seed script and tests.
 */

export const OPTION_LABELS = ["A", "B", "C", "D", "E"] as const;
export type OptionLabel = (typeof OPTION_LABELS)[number];

export const QUESTION_TYPES = ["SINGLE", "MULTIPLE", "TRUE_FALSE"] as const;
export type QuestionTypeValue = (typeof QUESTION_TYPES)[number];

export const QUESTION_LEVELS = ["LV1", "LV2", "LV3", "GENERAL"] as const;
export type QuestionLevelValue = (typeof QUESTION_LEVELS)[number];

/** True/false questions are stored as two fixed options so grading is uniform. */
export const TRUE_FALSE_OPTIONS = [
  { label: "BENAR", text: "Benar", textZh: "正确", value: true },
  { label: "SALAH", text: "Salah", textZh: "错误", value: false },
] as const;

const textSchema = z.string().trim().min(1);

const baseShape = {
  number: z.int().positive(),
  level: z.enum(QUESTION_LEVELS),
  groupKey: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "groupKey must be kebab-case")
    .optional(),
  text: textSchema,
  textZh: textSchema.optional(),
};

const choiceShape = {
  ...baseShape,
  options: z.array(textSchema).min(2).max(OPTION_LABELS.length),
  optionsZh: z.array(textSchema).optional(),
};

function checkChoiceEntry(
  entry: { options: string[]; optionsZh?: string[] },
  answers: OptionLabel[],
  ctx: z.RefinementCtx,
) {
  const available = OPTION_LABELS.slice(0, entry.options.length) as readonly string[];
  for (const answer of answers) {
    if (!available.includes(answer)) {
      ctx.addIssue({
        code: "custom",
        path: ["answer"],
        message: `Answer "${answer}" has no matching option (options: ${available.join(", ")})`,
      });
    }
  }
  if (new Set(answers).size !== answers.length) {
    ctx.addIssue({ code: "custom", path: ["answer"], message: "Answer labels must be unique" });
  }
  if (entry.optionsZh && entry.optionsZh.length !== entry.options.length) {
    ctx.addIssue({
      code: "custom",
      path: ["optionsZh"],
      message: `optionsZh has ${entry.optionsZh.length} items, options has ${entry.options.length}`,
    });
  }
}

export const singleEntrySchema = z
  .strictObject({ ...choiceShape, answer: z.enum(OPTION_LABELS) })
  .superRefine((entry, ctx) => checkChoiceEntry(entry, [entry.answer], ctx));

export const multipleEntrySchema = z
  .strictObject({ ...choiceShape, answer: z.array(z.enum(OPTION_LABELS)).min(1) })
  .superRefine((entry, ctx) => checkChoiceEntry(entry, entry.answer, ctx));

export const trueFalseEntrySchema = z.strictObject({ ...baseShape, answer: z.boolean() });

export type SingleEntry = z.infer<typeof singleEntrySchema>;
export type MultipleEntry = z.infer<typeof multipleEntrySchema>;
export type TrueFalseEntry = z.infer<typeof trueFalseEntrySchema>;

export interface OptionSeedRecord {
  label: string;
  text: string;
  textZh: string | null;
  isCorrect: boolean;
  order: number;
}

export interface QuestionSeedRecord {
  number: number;
  type: QuestionTypeValue;
  level: QuestionLevelValue;
  groupKey: string | null;
  text: string;
  textZh: string | null;
  options: OptionSeedRecord[];
}

export interface RawQuestionBank {
  single: unknown;
  multiple: unknown;
  trueFalse: unknown;
}

export class QuestionBankError extends Error {
  constructor(readonly problems: string[]) {
    super(`Invalid question bank:\n- ${problems.join("\n- ")}`);
    this.name = "QuestionBankError";
  }
}

function choiceOptions(entry: SingleEntry | MultipleEntry, correct: readonly string[]): OptionSeedRecord[] {
  return entry.options.map((text, index) => {
    const label = OPTION_LABELS[index];
    return {
      label,
      text,
      textZh: entry.optionsZh?.[index] ?? null,
      isCorrect: correct.includes(label),
      order: index,
    };
  });
}

function base(entry: SingleEntry | MultipleEntry | TrueFalseEntry, type: QuestionTypeValue) {
  return {
    number: entry.number,
    type,
    level: entry.level,
    groupKey: entry.groupKey ?? null,
    text: entry.text,
    textZh: entry.textZh ?? null,
  };
}

function parseFile<T>(schema: z.ZodType<T>, raw: unknown, file: string, problems: string[]): T[] {
  const result = z.array(schema).safeParse(raw);
  if (!result.success) {
    problems.push(`${file}:\n${z.prettifyError(result.error)}`);
    return [];
  }
  return result.data;
}

/**
 * Validates all three source files and returns records sorted by number.
 * Throws QuestionBankError listing every problem found.
 */
export function parseQuestionBank(raw: RawQuestionBank): QuestionSeedRecord[] {
  const problems: string[] = [];

  const single = parseFile(singleEntrySchema, raw.single, "single.json", problems);
  const multiple = parseFile(multipleEntrySchema, raw.multiple, "multiple.json", problems);
  const trueFalse = parseFile(trueFalseEntrySchema, raw.trueFalse, "true-false.json", problems);

  if (problems.length > 0) throw new QuestionBankError(problems);

  const records: QuestionSeedRecord[] = [
    ...single.map((e) => ({ ...base(e, "SINGLE"), options: choiceOptions(e, [e.answer]) })),
    ...multiple.map((e) => ({ ...base(e, "MULTIPLE"), options: choiceOptions(e, e.answer) })),
    ...trueFalse.map((e) => ({
      ...base(e, "TRUE_FALSE"),
      options: TRUE_FALSE_OPTIONS.map((o, order) => ({
        label: o.label,
        text: o.text,
        textZh: o.textZh,
        isCorrect: o.value === e.answer,
        order,
      })),
    })),
  ].sort((a, b) => a.number - b.number);

  const seen = new Set<number>();
  for (const { number } of records) {
    if (seen.has(number)) problems.push(`Duplicate question number ${number}`);
    seen.add(number);
  }

  const groupSizes = new Map<string, number>();
  for (const { groupKey } of records) {
    if (groupKey) groupSizes.set(groupKey, (groupSizes.get(groupKey) ?? 0) + 1);
  }
  for (const [key, size] of groupSizes) {
    if (size < 2) problems.push(`groupKey "${key}" is used by only one question`);
  }

  if (problems.length > 0) throw new QuestionBankError(problems);
  return records;
}
