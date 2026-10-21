import "server-only";
import type { QuestionLevelValue } from "@/lib/domain";
import { db } from "@/server/db";

/** Active questions eligible for picking; metadata only (no text, no answer keys). */
export function findActiveQuestionPool(levels: readonly QuestionLevelValue[] | null) {
  return db.question.findMany({
    where: { isActive: true, ...(levels && { level: { in: [...levels] } }) },
    select: { id: true, type: true, level: true, groupKey: true },
  });
}
