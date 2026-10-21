import type { Composition } from "@/config/exam-presets";
import { QUESTION_TYPES, type QuestionTypeValue } from "@/lib/domain";
import { shuffle, type Rng } from "@/lib/random";

export interface PickableQuestion {
  id: string;
  type: QuestionTypeValue;
  groupKey: string | null;
}

export class InsufficientQuestionsError extends Error {
  constructor(
    readonly type: QuestionTypeValue,
    readonly requested: number,
    readonly available: number,
  ) {
    super(`Not enough ${type} questions: requested ${requested}, could pick ${available}`);
    this.name = "InsufficientQuestionsError";
  }
}

/**
 * Picks questions for one exam session.
 * - Result is grouped by section (SINGLE → MULTIPLE → TRUE_FALSE), shuffled within each.
 * - At most one question per `groupKey` (near-duplicates) for fixed compositions.
 * - Sections with the least slack are filled first so group exclusions fall on
 *   sections that can absorb them.
 */
export function pickQuestions<T extends PickableQuestion>(
  pool: readonly T[],
  composition: Composition,
  rng: Rng = Math.random,
): T[] {
  const byType = Object.fromEntries(
    QUESTION_TYPES.map((type) => [type, pool.filter((q) => q.type === type)]),
  ) as Record<QuestionTypeValue, T[]>;

  if (composition === "ALL") {
    return QUESTION_TYPES.flatMap((type) => shuffle(byType[type], rng));
  }

  const slack = (type: QuestionTypeValue) => byType[type].length - composition[type];
  const fillOrder = QUESTION_TYPES.filter((type) => composition[type] > 0).sort((a, b) => slack(a) - slack(b));

  const usedGroups = new Set<string>();
  const picked = Object.fromEntries(QUESTION_TYPES.map((type) => [type, [] as T[]])) as Record<
    QuestionTypeValue,
    T[]
  >;

  for (const type of fillOrder) {
    const needed = composition[type];
    for (const question of shuffle(byType[type], rng)) {
      if (picked[type].length === needed) break;
      if (question.groupKey !== null) {
        if (usedGroups.has(question.groupKey)) continue;
        usedGroups.add(question.groupKey);
      }
      picked[type].push(question);
    }
    if (picked[type].length < needed) {
      throw new InsufficientQuestionsError(type, needed, picked[type].length);
    }
  }

  return QUESTION_TYPES.flatMap((type) => picked[type]);
}
