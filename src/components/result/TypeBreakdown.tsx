"use client";

import { motion, MotionConfig } from "motion/react";
import { QUESTION_TYPE_LABEL, QUESTION_TYPES, type QuestionTypeValue } from "@/lib/domain";
import { formatScore } from "@/lib/format";
import type { TallyDTO } from "@/types/dto";

const SEGMENTS = [
  { key: "correct", label: "Benar", className: "bg-success" },
  { key: "wrong", label: "Salah", className: "bg-danger" },
  { key: "unanswered", label: "Kosong", className: "bg-border-strong" },
] as const;

/** One stacked bar per question type: correct / wrong / empty. */
export function TypeBreakdown({ byType }: { byType: Record<QuestionTypeValue, TallyDTO> }) {
  const rows = QUESTION_TYPES.filter((type) => byType[type].total > 0);

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col gap-6">
        <ul className="flex flex-col gap-5">
          {rows.map((type, rowIndex) => {
            const tally = byType[type];
            return (
              <li key={type} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-display font-semibold">{QUESTION_TYPE_LABEL[type]}</span>
                  <span className="text-fg-muted text-sm tabular-nums">
                    <span className="text-fg font-semibold">{tally.correct}</span>/{tally.total} benar ·{" "}
                    {formatScore((tally.correct / tally.total) * 100)}%
                  </span>
                </div>
                <div
                  role="img"
                  aria-label={`${QUESTION_TYPE_LABEL[type]}: ${tally.correct} benar, ${tally.wrong} salah, ${tally.unanswered} kosong dari ${tally.total} soal`}
                  className="bg-surface-2 flex h-3 gap-0.5 overflow-hidden rounded-full"
                >
                  {SEGMENTS.map((segment, segmentIndex) => {
                    const count = tally[segment.key];
                    if (count === 0) return null;
                    return (
                      <motion.span
                        key={segment.key}
                        className={`${segment.className} h-full first:rounded-l-full last:rounded-r-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / tally.total) * 100}%` }}
                        transition={{
                          duration: 0.9,
                          delay: 0.5 + rowIndex * 0.12 + segmentIndex * 0.08,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      />
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>

        <ul className="text-fg-muted flex flex-wrap gap-x-4 gap-y-2 text-xs">
          {SEGMENTS.map((segment) => (
            <li key={segment.key} className="flex items-center gap-1.5">
              <span aria-hidden className={`${segment.className} size-2.5 rounded-full`} />
              {segment.label}
            </li>
          ))}
        </ul>
      </div>
    </MotionConfig>
  );
}
