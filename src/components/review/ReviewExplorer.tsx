"use client";

import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { useSearchParams } from "next/navigation";
import { motion, MotionConfig } from "motion/react";
import { CheckCircle2, CircleDashed, Flag, Grid3x3, Languages, XCircle, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { cn } from "@/lib/cn";
import { QUESTION_TYPE_LABEL, QUESTION_TYPES } from "@/lib/domain";
import {
  matchesReviewFilter,
  parseReviewFilter,
  REVIEW_FILTER_LABEL,
  REVIEW_FILTERS,
  type ReviewFilter,
} from "@/lib/review-filter";
import type { AttemptReviewDTO } from "@/types/dto";
import { ReviewItem } from "./ReviewItem";
import { ReviewMap, type ReviewMapItem } from "./ReviewMap";

const EMPTY_STATE: Record<ReviewFilter, { icon: LucideIcon; text: string }> = {
  all: { icon: CircleDashed, text: "Tidak ada soal." },
  correct: { icon: CircleDashed, text: "Belum ada jawaban yang benar. Pelajari pembahasan di filter Semua." },
  wrong: { icon: CheckCircle2, text: "Tidak ada jawaban yang salah." },
  empty: { icon: CheckCircle2, text: "Semua soal sudah dijawab." },
  flagged: { icon: Flag, text: "Tidak ada soal yang ditandai ragu-ragu." },
};

const FLASH_MS = 1600;

export function ReviewExplorer({ review }: { review: AttemptReviewDTO }) {
  const searchParams = useSearchParams();
  const [filter, setFilterState] = useState<ReviewFilter>(() => parseReviewFilter(searchParams.get("filter")));
  const [showZh, setShowZh] = useState(true);
  const [mapOpen, setMapOpen] = useState(false);
  const [flashed, setFlashed] = useState<number | null>(null);

  useEffect(() => {
    if (flashed === null) return;
    const timer = window.setTimeout(() => setFlashed(null), FLASH_MS);
    return () => window.clearTimeout(timer);
  }, [flashed]);

  const items = review.questions.map((question) => {
    const answered = question.selectedOptionIds.length > 0;
    const outcome = { answered, isCorrect: question.isCorrect, flagged: question.flagged };
    const status: ReviewMapItem["status"] = question.isCorrect ? "correct" : answered ? "wrong" : "empty";
    return { question, outcome, status };
  });
  const counts = Object.fromEntries(
    REVIEW_FILTERS.map((f) => [f, items.filter((item) => matchesReviewFilter(f, item.outcome)).length]),
  ) as Record<ReviewFilter, number>;
  // Hide the flagged filter when nothing was flagged, unless it was deep-linked.
  const filters = REVIEW_FILTERS.filter((f) => f !== "flagged" || counts.flagged > 0 || filter === "flagged");

  const visible = items.filter((item) => matchesReviewFilter(filter, item.outcome));
  const sections = QUESTION_TYPES.map((type) => ({
    type,
    items: visible.filter((item) => item.question.type === type),
  })).filter((section) => section.items.length > 0);

  const mapItems: ReviewMapItem[] = items.map(({ question, outcome, status }) => ({
    position: question.position,
    status,
    flagged: question.flagged,
    visible: matchesReviewFilter(filter, outcome),
  }));

  const hasTranslations = review.questions.some((q) => q.textZh);

  function setFilter(next: ReviewFilter) {
    setFilterState(next);
    // Keep the URL shareable without a server round-trip.
    const url = new URL(window.location.href);
    if (next === "all") url.searchParams.delete("filter");
    else url.searchParams.set("filter", next);
    window.history.replaceState(null, "", url);
  }

  function jumpTo(position: number) {
    const item = items[position];
    flushSync(() => {
      setMapOpen(false);
      if (item && !matchesReviewFilter(filter, item.outcome)) setFilter("all");
      setFlashed(position);
    });
    // Wait a frame so the sheet has closed and released the page scroll lock.
    requestAnimationFrame(() => {
      const target = document.getElementById(`soal-${position + 1}`);
      if (!target) return;
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
      target.focus({ preventScroll: true });
    });
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="bg-bg/85 border-border sticky top-0 z-30 -mx-5 border-b px-5 py-3 backdrop-blur-md sm:-mx-8 sm:px-8">
        <div className="flex items-center gap-2">
          <fieldset className="min-w-0 flex-1">
            <legend className="sr-only">Saring soal</legend>
            {/* Edge fade hints that the chips scroll on narrow screens. */}
            <div className="-my-1 flex gap-1.5 overflow-x-auto py-1 pr-6 [mask-image:linear-gradient(to_right,black_calc(100%-1.5rem),transparent)] [scrollbar-width:none] sm:pr-0 sm:[mask-image:none] [&::-webkit-scrollbar]:hidden">
              {filters.map((f) => (
                <label
                  key={f}
                  className={cn(
                    // relative: keeps the sr-only radio inside the scroller instead of widening the page.
                    "font-display relative flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium select-none",
                    "transition-[background-color,border-color,color] duration-200",
                    "has-[input:focus-visible]:outline-ring has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2",
                    "has-checked:bg-fg has-checked:text-bg has-checked:border-transparent",
                    "border-border bg-surface text-fg-muted not-has-checked:hover:text-fg not-has-checked:hover:border-border-strong",
                  )}
                >
                  <input
                    type="radio"
                    name="review-filter"
                    value={f}
                    checked={filter === f}
                    onChange={() => setFilter(f)}
                    className="sr-only"
                  />
                  {f === "correct" && <CheckCircle2 aria-hidden className="text-success size-3.5" />}
                  {f === "wrong" && <XCircle aria-hidden className="text-danger size-3.5" />}
                  {f === "empty" && <CircleDashed aria-hidden className="size-3.5" />}
                  {f === "flagged" && <Flag aria-hidden className="text-info size-3.5" />}
                  {REVIEW_FILTER_LABEL[f]}
                  <span className="tabular-nums opacity-70">{counts[f]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {hasTranslations && (
            <button
              type="button"
              onClick={() => setShowZh((v) => !v)}
              aria-pressed={showZh}
              aria-label="Tampilkan terjemahan Mandarin"
              title="Terjemahan 中文"
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-full border transition-colors",
                showZh ? "border-accent bg-accent-soft text-accent" : "border-border text-fg-muted hover:text-fg",
              )}
            >
              <Languages aria-hidden className="size-4" />
            </button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setMapOpen(true)}
            aria-label="Peta jawaban"
            className="lg:hidden"
          >
            <Grid3x3 aria-hidden className="size-4" />
            <span className="max-sm:hidden">Peta</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 pt-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-10">
        <motion.div
          key={filter}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="flex min-w-0 flex-col gap-10"
        >
          <p aria-live="polite" className="sr-only">
            Menampilkan {visible.length} soal
          </p>
          {sections.length === 0 ? (
            <EmptyState filter={filter} />
          ) : (
            sections.map(({ type, items: sectionItems }) => (
              <section key={type} aria-labelledby={`section-${type}`} className="flex flex-col gap-4">
                <h2
                  id={`section-${type}`}
                  className="text-fg-subtle flex items-center gap-3 text-xs font-medium tracking-wide uppercase"
                >
                  {QUESTION_TYPE_LABEL[type]}
                  <span className="tabular-nums">· {sectionItems.length} soal</span>
                  <span aria-hidden className="bg-border h-px flex-1" />
                </h2>
                {sectionItems.map(({ question }) => (
                  <ReviewItem
                    key={question.id}
                    question={question}
                    showZh={showZh}
                    highlighted={flashed === question.position}
                  />
                ))}
              </section>
            ))
          )}
        </motion.div>

        <aside className="hidden lg:block">
          <div className="bg-surface border-border rounded-card shadow-card sticky top-24 flex flex-col gap-4 border p-5">
            <p className="font-display text-sm font-semibold">Peta jawaban</p>
            <ReviewMap items={mapItems} onJump={jumpTo} />
          </div>
        </aside>
      </div>

      <Dialog
        variant="sheet"
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        title="Peta jawaban"
        description={`${counts.correct} benar · ${counts.wrong} salah · ${counts.empty} kosong`}
      >
        <ReviewMap items={mapItems} onJump={jumpTo} />
      </Dialog>
    </MotionConfig>
  );
}

function EmptyState({ filter }: { filter: ReviewFilter }) {
  const { icon: Icon, text } = EMPTY_STATE[filter];
  return (
    <div className="border-border text-fg-muted rounded-card flex flex-col items-center gap-3 border border-dashed px-6 py-16 text-center">
      <Icon aria-hidden className="text-fg-subtle size-8" />
      <p>{text}</p>
    </div>
  );
}
