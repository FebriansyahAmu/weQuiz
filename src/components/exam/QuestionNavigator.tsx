"use client";

import { Flag } from "lucide-react";
import { cn } from "@/lib/cn";
import { QUESTION_TYPE_LABEL, QUESTION_TYPES } from "@/lib/domain";
import type { PublicQuestionDTO } from "@/types/dto";

export interface NavigatorAnswer {
  answered: boolean;
  flagged: boolean;
}

interface QuestionNavigatorProps {
  questions: PublicQuestionDTO[];
  status: (questionId: string) => NavigatorAnswer;
  currentIndex: number;
  onJump: (index: number) => void;
  /** Hide the built-in heading row when the container already provides a title. */
  hideHeading?: boolean;
  className?: string;
}

export function QuestionNavigator({
  questions,
  status,
  currentIndex,
  onJump,
  hideHeading = false,
  className,
}: QuestionNavigatorProps) {
  const answeredCount = questions.filter((q) => status(q.id).answered).length;
  const sections = QUESTION_TYPES.map((type) => ({
    type,
    items: questions.map((q, index) => ({ q, index })).filter(({ q }) => q.type === type),
  })).filter((s) => s.items.length > 0);

  return (
    <nav aria-label="Navigasi soal" className={cn("flex flex-col gap-5", className)}>
      {!hideHeading && (
        <div className="flex items-baseline justify-between">
          <p className="font-display text-sm font-semibold">Daftar soal</p>
          <p className="text-fg-muted text-sm tabular-nums">
            <span className="text-fg font-semibold">{answeredCount}</span> / {questions.length} terjawab
          </p>
        </div>
      )}

      {sections.map(({ type, items }) => (
        <section key={type} className="flex flex-col gap-2.5">
          <h3 className="text-fg-subtle text-xs font-medium tracking-wide uppercase">
            {QUESTION_TYPE_LABEL[type]}{" "}
            <span className="tabular-nums">
              · {items[0].index + 1}–{items[items.length - 1].index + 1}
            </span>
          </h3>
          <ol className="grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-2">
            {items.map(({ q, index }) => {
              const { answered, flagged } = status(q.id);
              const current = index === currentIndex;
              const label = `Soal ${index + 1}, ${answered ? "terjawab" : "belum dijawab"}${flagged ? ", ragu-ragu" : ""}`;
              return (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => onJump(index)}
                    aria-label={label}
                    aria-current={current ? "step" : undefined}
                    className={cn(
                      "font-display relative grid h-10 w-full place-items-center rounded-xl text-sm font-medium tabular-nums",
                      "transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:scale-95",
                      answered
                        ? "bg-fg text-bg"
                        : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg border",
                      flagged && !answered && "border-info text-info border-dashed",
                      current && "ring-ring ring-offset-surface ring-2 ring-offset-2",
                    )}
                  >
                    {index + 1}
                    {flagged && (
                      <span className="bg-info absolute -top-1 -right-1 grid size-4 place-items-center rounded-full text-white">
                        <Flag aria-hidden className="size-2.5" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      <ul className="text-fg-muted border-border flex flex-wrap gap-x-4 gap-y-2 border-t pt-4 text-xs">
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="bg-fg size-3 rounded" /> Terjawab
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="border-border-strong size-3 rounded border" /> Belum
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="bg-info grid size-3 place-items-center rounded-full">
            <Flag className="size-2 text-white" strokeWidth={3} />
          </span>
          Ragu-ragu
        </li>
      </ul>
    </nav>
  );
}
