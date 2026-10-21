/** Review page filters, also accepted as `?filter=` so the result page can deep-link into them. */
export const REVIEW_FILTERS = ["all", "correct", "wrong", "empty", "flagged"] as const;
export type ReviewFilter = (typeof REVIEW_FILTERS)[number];

export const REVIEW_FILTER_LABEL: Record<ReviewFilter, string> = {
  all: "Semua",
  correct: "Benar",
  wrong: "Salah",
  empty: "Kosong",
  flagged: "Ragu-ragu",
};

export function parseReviewFilter(value: string | null | undefined): ReviewFilter {
  return REVIEW_FILTERS.find((filter) => filter === value) ?? "all";
}

export interface ReviewOutcome {
  answered: boolean;
  isCorrect: boolean;
  flagged: boolean;
}

export function matchesReviewFilter(filter: ReviewFilter, item: ReviewOutcome): boolean {
  switch (filter) {
    case "all":
      return true;
    case "correct":
      return item.isCorrect;
    case "wrong":
      return item.answered && !item.isCorrect;
    case "empty":
      return !item.answered;
    case "flagged":
      return item.flagged;
  }
}
