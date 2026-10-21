import { describe, expect, it } from "vitest";
import { getScoreBand, SCORE_BANDS } from "@/config/grading";
import { formatDuration, formatScore } from "@/lib/format";
import { matchesReviewFilter, parseReviewFilter, REVIEW_FILTERS } from "@/lib/review-filter";

describe("formatScore", () => {
  it("uses the Indonesian decimal comma and drops trailing zeros", () => {
    expect(formatScore(66.67)).toBe("66,67");
    expect(formatScore(80)).toBe("80");
    expect(formatScore(0)).toBe("0");
    expect(formatScore(100)).toBe("100");
  });
});

describe("formatDuration", () => {
  it.each([
    [0, "0 dtk"],
    [42, "42 dtk"],
    [60, "1 mnt"],
    [754, "12 mnt 34 dtk"],
    [3600, "1 j"],
    [3725, "1 j 2 mnt"],
    [-5, "0 dtk"],
  ])("%i s → %s", (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });
});

describe("getScoreBand", () => {
  it("picks the band by inclusive lower bound", () => {
    expect(getScoreBand(100).label).toBe("Istimewa");
    expect(getScoreBand(90).label).toBe("Istimewa");
    expect(getScoreBand(89.99).label).toBe("Baik");
    expect(getScoreBand(75).label).toBe("Baik");
    expect(getScoreBand(60).label).toBe("Cukup");
    expect(getScoreBand(59.6).label).toBe("Perlu belajar lagi");
    expect(getScoreBand(0).label).toBe("Perlu belajar lagi");
  });

  it("bands are ordered high to low and end at 0", () => {
    const mins = SCORE_BANDS.map((b) => b.min);
    expect(mins).toEqual([...mins].sort((a, b) => b - a));
    expect(mins.at(-1)).toBe(0);
  });
});

describe("review filters", () => {
  const correct = { answered: true, isCorrect: true, flagged: false };
  const wrong = { answered: true, isCorrect: false, flagged: true };
  const empty = { answered: false, isCorrect: false, flagged: false };

  it("parses known values and falls back to all", () => {
    for (const filter of REVIEW_FILTERS) expect(parseReviewFilter(filter)).toBe(filter);
    expect(parseReviewFilter("nope")).toBe("all");
    expect(parseReviewFilter(null)).toBe("all");
  });

  it("splits outcomes into disjoint correct / wrong / empty sets", () => {
    expect([correct, wrong, empty].map((o) => matchesReviewFilter("correct", o))).toEqual([true, false, false]);
    expect([correct, wrong, empty].map((o) => matchesReviewFilter("wrong", o))).toEqual([false, true, false]);
    expect([correct, wrong, empty].map((o) => matchesReviewFilter("empty", o))).toEqual([false, false, true]);
    expect([correct, wrong, empty].map((o) => matchesReviewFilter("flagged", o))).toEqual([false, true, false]);
    expect([correct, wrong, empty].every((o) => matchesReviewFilter("all", o))).toBe(true);
  });
});
