import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { EXAM_PRESETS } from "@/config/exam-presets";
import { QUESTION_TYPES, type QuestionLevelValue, type QuestionTypeValue } from "@/lib/domain";
import { seededRng } from "@/lib/random";
import { parseQuestionBank } from "@/lib/validation/question-bank";
import { InsufficientQuestionsError, pickQuestions, type PickableQuestion } from "@/server/services/question-picker";

interface TestQuestion extends PickableQuestion {
  level: QuestionLevelValue;
}

const q = (id: string, type: QuestionTypeValue, groupKey: string | null = null): TestQuestion => ({
  id,
  type,
  groupKey,
  level: "LV1",
});

function makePool(counts: Record<QuestionTypeValue, number>): TestQuestion[] {
  return QUESTION_TYPES.flatMap((type) =>
    Array.from({ length: counts[type] }, (_, i) => q(`${type}-${i}`, type)),
  );
}

describe("pickQuestions", () => {
  const pool = makePool({ SINGLE: 30, MULTIPLE: 20, TRUE_FALSE: 15 });
  const composition = { SINGLE: 10, MULTIPLE: 5, TRUE_FALSE: 3 };

  it("picks the requested number of questions per type, grouped by section", () => {
    const picked = pickQuestions(pool, composition, seededRng(1));
    expect(picked.map((p) => p.type)).toEqual([
      ...Array(10).fill("SINGLE"),
      ...Array(5).fill("MULTIPLE"),
      ...Array(3).fill("TRUE_FALSE"),
    ]);
    expect(new Set(picked.map((p) => p.id)).size).toBe(picked.length);
  });

  it("is deterministic for a given seed and varies across seeds", () => {
    const ids = (seed: number) => pickQuestions(pool, composition, seededRng(seed)).map((p) => p.id);
    expect(ids(42)).toEqual(ids(42));
    expect(ids(42)).not.toEqual(ids(43));
  });

  it("never picks two questions from the same group", () => {
    const grouped = [
      q("s1", "SINGLE", "g1"),
      q("s2", "SINGLE", "g1"),
      q("s3", "SINGLE"),
      q("m1", "MULTIPLE", "g1"),
      q("m2", "MULTIPLE"),
    ];
    for (let seed = 0; seed < 50; seed++) {
      const picked = pickQuestions(grouped, { SINGLE: 2, MULTIPLE: 1, TRUE_FALSE: 0 }, seededRng(seed));
      expect(picked.filter((p) => p.groupKey === "g1")).toHaveLength(1);
    }
  });

  it("fills the section with the least slack first", () => {
    // MULTIPLE has no slack: its only candidates share groups with SINGLE.
    // Filling SINGLE first could take g1/g2 and leave MULTIPLE short.
    const tight = [
      q("s1", "SINGLE", "g1"),
      q("s2", "SINGLE", "g2"),
      q("s3", "SINGLE"),
      q("s4", "SINGLE"),
      q("m1", "MULTIPLE", "g1"),
      q("m2", "MULTIPLE", "g2"),
    ];
    for (let seed = 0; seed < 50; seed++) {
      const picked = pickQuestions(tight, { SINGLE: 2, MULTIPLE: 2, TRUE_FALSE: 0 }, seededRng(seed));
      expect(picked.map((p) => p.id).sort()).toEqual(["m1", "m2", "s3", "s4"]);
    }
  });

  it("throws when a section cannot be filled", () => {
    expect(() => pickQuestions(pool, { SINGLE: 31, MULTIPLE: 0, TRUE_FALSE: 0 })).toThrow(
      InsufficientQuestionsError,
    );
  });

  it("returns every question for the ALL composition, ignoring groups", () => {
    const grouped = [...pool, q("dup", "SINGLE", "g"), q("dup2", "SINGLE", "g")];
    const picked = pickQuestions(grouped, "ALL", seededRng(7));
    expect(picked).toHaveLength(grouped.length);
    expect(picked.map((p) => p.type)).toEqual([...picked.map((p) => p.type)].sort(
      (a, b) => QUESTION_TYPES.indexOf(a) - QUESTION_TYPES.indexOf(b),
    ));
  });
});

describe("exam presets against the real question bank", () => {
  const dataDir = path.join(import.meta.dirname, "..", "prisma", "seed", "data");
  const readJson = (file: string): unknown => JSON.parse(readFileSync(path.join(dataDir, file), "utf8"));
  const bank: TestQuestion[] = parseQuestionBank({
    single: readJson("single.json"),
    multiple: readJson("multiple.json"),
    trueFalse: readJson("true-false.json"),
  }).map((r) => ({ id: String(r.number), type: r.type, level: r.level, groupKey: r.groupKey }));

  for (const preset of EXAM_PRESETS) {
    it(`"${preset.key}" can always be filled`, () => {
      const levels: readonly QuestionLevelValue[] | null = preset.levels;
      const pool = levels ? bank.filter((b) => levels.includes(b.level)) : bank;
      const expectedTotal =
        preset.composition === "ALL"
          ? pool.length
          : QUESTION_TYPES.reduce((sum, t) => sum + (preset.composition as Record<QuestionTypeValue, number>)[t], 0);

      for (let seed = 0; seed < 300; seed++) {
        const picked = pickQuestions(pool, preset.composition, seededRng(seed));
        expect(picked).toHaveLength(expectedTotal);
        if (levels) expect(picked.every((p) => levels.includes(p.level))).toBe(true);
      }
    });
  }
});
