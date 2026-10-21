"use client";

import { Flag } from "lucide-react";
import { cn } from "@/lib/cn";

export interface ReviewMapItem {
  position: number;
  status: "correct" | "wrong" | "empty";
  flagged: boolean;
  /** Matches the active filter; others are dimmed but still clickable. */
  visible: boolean;
}

const STATUS_LABEL = { correct: "benar", wrong: "salah", empty: "tidak dijawab" } as const;

/** Answer map: every question number colored by outcome. Clicking jumps to it. */
export function ReviewMap({ items, onJump }: { items: ReviewMapItem[]; onJump: (position: number) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <ol className="grid grid-cols-[repeat(auto-fill,minmax(2.25rem,1fr))] gap-1.5">
        {items.map(({ position, status, flagged, visible }) => (
          <li key={position}>
            <button
              type="button"
              onClick={() => onJump(position)}
              aria-label={`Soal ${position + 1}, ${STATUS_LABEL[status]}${flagged ? ", ragu-ragu" : ""}`}
              className={cn(
                "font-display relative grid h-9 w-full place-items-center rounded-lg text-xs font-semibold tabular-nums",
                "transition-[opacity,transform,background-color] duration-200 active:scale-95",
                status === "correct" && "bg-success-soft text-success hover:bg-success hover:text-bg",
                status === "wrong" && "bg-danger-soft text-danger hover:bg-danger hover:text-bg",
                status === "empty" && "border-border-strong text-fg-muted hover:bg-surface-2 border border-dashed",
                !visible && "opacity-30",
              )}
            >
              {position + 1}
              {flagged && (
                <span className="bg-info absolute -top-1 -right-1 grid size-3.5 place-items-center rounded-full text-white">
                  <Flag aria-hidden className="size-2" strokeWidth={3} />
                </span>
              )}
            </button>
          </li>
        ))}
      </ol>
      <ul className="text-fg-muted border-border flex flex-wrap gap-x-4 gap-y-2 border-t pt-4 text-xs">
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="bg-success size-3 rounded" /> Benar
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="bg-danger size-3 rounded" /> Salah
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="border-border-strong size-3 rounded border border-dashed" /> Kosong
        </li>
      </ul>
    </div>
  );
}
