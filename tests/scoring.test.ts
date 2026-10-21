import { describe, expect, it } from "vitest";
import { gradeItems, isAnswerCorrect, summarize, toPercentage } from "@/server/services/scoring";

describe("isAnswerCorrect", () => {
  it("accepts the single correct option", () => {
    expect(isAnswerCorrect(["b"], ["b"])).toBe(true);
    expect(isAnswerCorrect(["a"], ["b"])).toBe(false);
  });

  it("requires the exact set for multi-answer questions, in any order", () => {
    expect(isAnswerCorrect(["d", "a", "c"], ["a", "c", "d"])).toBe(true);
    expect(isAnswerCorrect(["a", "c"], ["a", "c", "d"])).toBe(false); // missing one
    expect(isAnswerCorrect(["a", "b", "c", "d"], ["a", "c", "d"])).toBe(false); // one extra
  });

  it("never counts an empty selection as correct", () => {
    expect(isAnswerCorrect([], ["a"])).toBe(false);
  });
});

describe("toPercentage", () => {
  it("rounds to two decimals", () => {
    expect(toPercentage(1, 3)).toBe(33.33);
    expect(toPercentage(2, 3)).toBe(66.67);
    expect(toPercentage(50, 50)).toBe(100);
    expect(toPercentage(0, 50)).toBe(0);
  });

  it("returns 0 for an empty exam", () => {
    expect(toPercentage(0, 0)).toBe(0);
  });
});

describe("summarize / gradeItems", () => {
  it("counts correct, wrong and unanswered separately, overall and per type", () => {
    const { results, summary } = gradeItems([
      { type: "SINGLE", selectedOptionIds: ["a"], correctOptionIds: ["a"] },
      { type: "SINGLE", selectedOptionIds: ["b"], correctOptionIds: ["a"] },
      { type: "MULTIPLE", selectedOptionIds: ["a", "c"], correctOptionIds: ["c", "a"] },
      { type: "MULTIPLE", selectedOptionIds: [], correctOptionIds: ["a"] },
      { type: "TRUE_FALSE", selectedOptionIds: ["salah"], correctOptionIds: ["benar"] },
    ]);

    expect(results).toEqual([true, false, true, false, false]);
    expect(summary).toMatchObject({ total: 5, correct: 2, wrong: 2, unanswered: 1, score: 40 });
    expect(summary.byType).toEqual({
      SINGLE: { total: 2, correct: 1, wrong: 1, unanswered: 0 },
      MULTIPLE: { total: 2, correct: 1, wrong: 0, unanswered: 1 },
      TRUE_FALSE: { total: 1, correct: 0, wrong: 1, unanswered: 0 },
    });
  });

  it("keeps correct + wrong + unanswered equal to total", () => {
    const summary = summarize([
      { type: "SINGLE", answered: true, isCorrect: true },
      { type: "SINGLE", answered: false, isCorrect: false },
      { type: "TRUE_FALSE", answered: true, isCorrect: false },
    ]);
    expect(summary.correct + summary.wrong + summary.unanswered).toBe(summary.total);
  });
});
