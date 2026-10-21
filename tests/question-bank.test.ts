import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  parseQuestionBank,
  QuestionBankError,
  type QuestionLevelValue,
  type QuestionSeedRecord,
} from "@/lib/validation/question-bank";

const dataDir = path.join(import.meta.dirname, "..", "prisma", "seed", "data");
const readJson = (file: string): unknown => JSON.parse(readFileSync(path.join(dataDir, file), "utf8"));

const raw = {
  single: readJson("single.json"),
  multiple: readJson("multiple.json"),
  trueFalse: readJson("true-false.json"),
};

/**
 * Answer key transcribed independently from the source PDF ("答案" lines),
 * used to cross-check the JSON data. One character per question for SINGLE and
 * TRUE_FALSE (T/F); label sets for MULTIPLE.
 */
const SINGLE_KEY = [
  "BCDADCCBAA", "BBBCBBDCBB", "CBBAABBCCB", "DBBBACCBBB", "CACBBCBCBA", // 1–50
  "CCBCBCBBBB", "CCBBAADCBD", "DCBABBCBBC", "CBBBCBBBCB", "ADDDDCACDD", // 51–100
  "CACDBADD", // 101–108
].join("");

const MULTIPLE_KEY = [
  "ACD", "BD", "AB", "ABCD", "ABCD", "AB", "ACD", "ABD", "ABD", "ABCD", // 109–118
  "ABD", "ABD", "ABD", "ABDE", "ACD", "BCD", "ACDE", "ABD", "ABC", "BCD", // 119–128
  "ABCE", "ABCDE", "ABD", "ABE", "AC", "ABC", "ACD", "ABD", "CD", "ABD", // 129–138
  "ACD", "ABE", "ABD", "ACD", "AB", "ABCE", "ABCE", "ABCE", "ABCE", "ABCE", // 139–148
  "ABDE", "ACD", "ACD", "ABDE", "ABCE", "ABCE", "ABD", "ABD", "ABCE", "ABCE", // 149–158
  "ABDE", "ABCE", "ABDE", "ABD", "ABDE", "ABCD", "ACD", "BD", "BCD", "ABC", // 159–168
  "CE", "ABD", "ABDE", "AD", "CD", "BC", "ABCD", "ABC", "BCD", "ACDE", // 169–178
  "ABDE", "ABCE", "ACDE", "BCDE", "ABCD", // 179–183
];

const TRUE_FALSE_KEY = [
  "TFTFFTTFFT", "FTTTFTFTFF", "TTFTFTFTFT", "TFTFTTFTTF", "TTTTFTTTTF", // 184–233
  "FFTTTTTTTF", "TTTFTFT", // 234–250
].join("");

/** Level per question number, from the color legend in the source PDF (PRD §4.2). */
function expectedLevel(n: number): QuestionLevelValue {
  const inRange = (ranges: [number, number][]) => ranges.some(([a, b]) => n >= a && n <= b);
  if (inRange([[1, 50], [109, 141], [157, 171], [184, 208], [224, 238]])) return "LV1";
  if (inRange([[51, 70], [142, 156], [209, 223]])) return "LV2";
  if (inRange([[71, 90]])) return "LV3";
  return "GENERAL";
}

function answerOf(record: QuestionSeedRecord): string {
  const correct = record.options.filter((o) => o.isCorrect);
  if (record.type === "TRUE_FALSE") return correct[0].label === "BENAR" ? "T" : "F";
  return correct.map((o) => o.label).join("");
}

describe("question bank data", () => {
  const records = parseQuestionBank(raw);

  it("contains 250 questions numbered 1–250 without gaps", () => {
    expect(records.map((r) => r.number)).toEqual(Array.from({ length: 250 }, (_, i) => i + 1));
  });

  it("has the expected type for each section", () => {
    for (const r of records) {
      const expected = r.number <= 108 ? "SINGLE" : r.number <= 183 ? "MULTIPLE" : "TRUE_FALSE";
      expect(r.type, `question ${r.number}`).toBe(expected);
    }
  });

  it("matches the independently transcribed answer key", () => {
    const expected = [...SINGLE_KEY, ...MULTIPLE_KEY, ...TRUE_FALSE_KEY];
    expect(expected).toHaveLength(250);
    const mismatches = records
      .filter((r, i) => answerOf(r) !== expected[i])
      .map((r) => `#${r.number}: data=${answerOf(r)} key=${expected[r.number - 1]}`);
    expect(mismatches).toEqual([]);
  });

  it("assigns levels according to the color legend", () => {
    const mismatches = records
      .filter((r) => r.level !== expectedLevel(r.number))
      .map((r) => `#${r.number}: ${r.level} (expected ${expectedLevel(r.number)})`);
    expect(mismatches).toEqual([]);
  });

  it("has exactly one correct option for single-choice and true/false questions", () => {
    for (const r of records.filter((q) => q.type !== "MULTIPLE")) {
      expect(r.options.filter((o) => o.isCorrect), `question ${r.number}`).toHaveLength(1);
    }
  });

  it("provides Chinese translations for every bilingual option set", () => {
    for (const r of records.filter((q) => q.textZh && q.type !== "TRUE_FALSE")) {
      expect(r.options.every((o) => o.textZh), `question ${r.number}`).toBe(true);
    }
  });
});

describe("parseQuestionBank validation", () => {
  const validSingle = { number: 1, level: "LV1", text: "Soal?", options: ["A1", "B1"], answer: "A" };
  const validMultiple = { number: 2, level: "LV1", text: "Soal?", options: ["A1", "B1", "C1"], answer: ["A", "C"] };
  const validTrueFalse = { number: 3, level: "GENERAL", text: "Pernyataan.", answer: false };

  const parse = (overrides: Partial<typeof raw>) =>
    parseQuestionBank({ single: [validSingle], multiple: [validMultiple], trueFalse: [validTrueFalse], ...overrides });

  it("normalizes valid entries into seed records", () => {
    const [single, multiple, trueFalse] = parse({});
    expect(single.options.map((o) => [o.label, o.isCorrect])).toEqual([["A", true], ["B", false]]);
    expect(multiple.options.filter((o) => o.isCorrect).map((o) => o.label)).toEqual(["A", "C"]);
    expect(trueFalse.options.map((o) => [o.label, o.isCorrect])).toEqual([["BENAR", false], ["SALAH", true]]);
  });

  it("rejects an answer without a matching option", () => {
    expect(() => parse({ single: [{ ...validSingle, answer: "C" }] })).toThrow(QuestionBankError);
  });

  it("rejects duplicate answer labels", () => {
    expect(() => parse({ multiple: [{ ...validMultiple, answer: ["A", "A"] }] })).toThrow(/unique/);
  });

  it("rejects a translation list that does not match the options", () => {
    expect(() => parse({ single: [{ ...validSingle, optionsZh: ["只有一个"] }] })).toThrow(/optionsZh/);
  });

  it("rejects unknown fields", () => {
    expect(() => parse({ single: [{ ...validSingle, explanation: "x" }] })).toThrow(QuestionBankError);
  });

  it("rejects duplicate question numbers across files", () => {
    expect(() => parse({ trueFalse: [{ ...validTrueFalse, number: 1 }] })).toThrow(/Duplicate question number 1/);
  });

  it("rejects a groupKey used by a single question", () => {
    expect(() => parse({ single: [{ ...validSingle, groupKey: "sendiri" }] })).toThrow(/only one question/);
  });
});
