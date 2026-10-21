import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import {
  parseQuestionBank,
  type OptionSeedRecord,
  type QuestionSeedRecord,
} from "../../src/lib/validation/question-bank";

/**
 * Idempotent question bank seed.
 * - New questions are inserted in bulk.
 * - Existing questions (matched by `number`) are updated only when they changed;
 *   options are upserted by label so their ids stay stable for past attempts.
 * - Questions removed from the source files are deactivated, never deleted.
 */

const dataDir = path.join(import.meta.dirname, "data");
const readJson = (file: string): unknown => JSON.parse(readFileSync(path.join(dataDir, file), "utf8"));

const records = parseQuestionBank({
  single: readJson("single.json"),
  multiple: readJson("multiple.json"),
  trueFalse: readJson("true-false.json"),
});

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

type ExistingQuestion = Awaited<ReturnType<typeof loadExisting>>[number];

function loadExisting() {
  return db.question.findMany({ include: { options: { orderBy: { order: "asc" } } } });
}

function sameOptions(a: OptionSeedRecord[], b: ExistingQuestion["options"]) {
  return (
    a.length === b.length &&
    a.every((o, i) => {
      const e = b[i];
      return (
        e.label === o.label &&
        e.text === o.text &&
        e.textZh === o.textZh &&
        e.isCorrect === o.isCorrect &&
        e.order === o.order
      );
    })
  );
}

function isUnchanged(record: QuestionSeedRecord, existing: ExistingQuestion) {
  return (
    existing.isActive &&
    existing.type === record.type &&
    existing.level === record.level &&
    existing.groupKey === record.groupKey &&
    existing.text === record.text &&
    existing.textZh === record.textZh &&
    sameOptions(record.options, existing.options)
  );
}

function toQuestionData(record: QuestionSeedRecord) {
  const { number, type, level, groupKey, text, textZh } = record;
  return { number, type, level, groupKey, text, textZh };
}

async function insertNew(newRecords: QuestionSeedRecord[]) {
  if (newRecords.length === 0) return;
  await db.$transaction(async (tx) => {
    const created = await tx.question.createManyAndReturn({
      data: newRecords.map(toQuestionData),
      select: { id: true, number: true },
    });
    const idByNumber = new Map(created.map((q) => [q.number, q.id]));
    await tx.option.createMany({
      data: newRecords.flatMap((record) =>
        record.options.map((option) => ({ ...option, questionId: idByNumber.get(record.number)! })),
      ),
    });
  });
}

async function updateChanged(record: QuestionSeedRecord, existing: ExistingQuestion) {
  const labels = record.options.map((o) => o.label);
  await db.$transaction([
    db.question.update({ where: { id: existing.id }, data: { ...toQuestionData(record), isActive: true } }),
    ...record.options.map((option) =>
      db.option.upsert({
        where: { questionId_label: { questionId: existing.id, label: option.label } },
        create: { ...option, questionId: existing.id },
        update: option,
      }),
    ),
    db.option.deleteMany({ where: { questionId: existing.id, label: { notIn: labels } } }),
  ]);
}

async function main() {
  const startedAt = performance.now();
  const existing = await loadExisting();
  const existingByNumber = new Map(existing.map((q) => [q.number, q]));
  const sourceNumbers = new Set(records.map((r) => r.number));

  const toCreate = records.filter((r) => !existingByNumber.has(r.number));
  const toUpdate = records.filter((r) => {
    const current = existingByNumber.get(r.number);
    return current !== undefined && !isUnchanged(r, current);
  });
  const toDeactivate = existing.filter((q) => q.isActive && !sourceNumbers.has(q.number));

  await insertNew(toCreate);
  for (const record of toUpdate) await updateChanged(record, existingByNumber.get(record.number)!);
  if (toDeactivate.length > 0) {
    await db.question.updateMany({
      where: { id: { in: toDeactivate.map((q) => q.id) } },
      data: { isActive: false },
    });
  }

  const counts = await db.question.groupBy({ by: ["type"], where: { isActive: true }, _count: true });
  const seconds = ((performance.now() - startedAt) / 1000).toFixed(1);

  console.log(`Question bank seeded in ${seconds}s`);
  console.log(
    `  created: ${toCreate.length}, updated: ${toUpdate.length}, ` +
      `unchanged: ${records.length - toCreate.length - toUpdate.length}, deactivated: ${toDeactivate.length}`,
  );
  console.log(`  active by type: ${counts.map((c) => `${c.type}=${c._count}`).join(", ")}`);
}

try {
  await main();
} finally {
  await db.$disconnect();
}
