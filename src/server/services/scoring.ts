import { QUESTION_TYPES, type QuestionTypeValue } from "@/lib/domain";

export interface Tally {
  total: number;
  correct: number;
  /** Answered but wrong. Unanswered questions are counted separately. */
  wrong: number;
  unanswered: number;
}

export interface ScoreSummary extends Tally {
  /** Percentage 0–100 with two decimals: correct / total × 100. */
  score: number;
  byType: Record<QuestionTypeValue, Tally>;
}

export interface GradableItem {
  type: QuestionTypeValue;
  selectedOptionIds: readonly string[];
  correctOptionIds: readonly string[];
}

export interface GradedItem {
  type: QuestionTypeValue;
  answered: boolean;
  isCorrect: boolean;
}

/**
 * All-or-nothing: the selected set must equal the correct set exactly
 * (order-independent). An empty selection is never correct.
 */
export function isAnswerCorrect(selected: readonly string[], correct: readonly string[]): boolean {
  if (selected.length === 0) return false;
  const chosen = new Set(selected);
  return chosen.size === correct.length && correct.every((id) => chosen.has(id));
}

export function toPercentage(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 10_000) / 100;
}

const emptyTally = (): Tally => ({ total: 0, correct: 0, wrong: 0, unanswered: 0 });

export function summarize(items: readonly GradedItem[]): ScoreSummary {
  const overall = emptyTally();
  const byType = Object.fromEntries(QUESTION_TYPES.map((t) => [t, emptyTally()])) as Record<
    QuestionTypeValue,
    Tally
  >;

  for (const item of items) {
    for (const tally of [overall, byType[item.type]]) {
      tally.total++;
      if (!item.answered) tally.unanswered++;
      else if (item.isCorrect) tally.correct++;
      else tally.wrong++;
    }
  }

  return { ...overall, score: toPercentage(overall.correct, overall.total), byType };
}

export function gradeItems(items: readonly GradableItem[]): { results: boolean[]; summary: ScoreSummary } {
  const graded = items.map((item) => ({
    type: item.type,
    answered: item.selectedOptionIds.length > 0,
    isCorrect: isAnswerCorrect(item.selectedOptionIds, item.correctOptionIds),
  }));
  return { results: graded.map((g) => g.isCorrect), summary: summarize(graded) };
}
