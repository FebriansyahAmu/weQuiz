"use client";

import { Grid3x3, Languages, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/cn";
import type { AutosaveSnapshot } from "@/lib/autosave-queue";
import { SaveIndicator } from "./SaveIndicator";
import { Timer } from "./Timer";

interface ExamHeaderProps {
  participantName: string;
  answered: number;
  total: number;
  remainingSeconds: number | null;
  saveSnapshot: AutosaveSnapshot;
  hasTranslations: boolean;
  showZh: boolean;
  onToggleZh: () => void;
  onOpenNavigator: () => void;
  onSubmit: () => void;
}

export function ExamHeader({
  participantName,
  answered,
  total,
  remainingSeconds,
  saveSnapshot,
  hasTranslations,
  showZh,
  onToggleZh,
  onOpenNavigator,
  onSubmit,
}: ExamHeaderProps) {
  const progress = total === 0 ? 0 : (answered / total) * 100;

  return (
    <header className="bg-bg/85 border-border sticky top-0 z-30 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
        <span className="bg-molten text-on-molten font-display grid size-8 shrink-0 place-items-center rounded-lg text-xs font-bold">
          wQ
        </span>
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="text-fg-subtle text-[0.7rem] tracking-wide uppercase">Peserta</span>
          <span className="font-display truncate text-sm font-semibold">{participantName}</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <SaveIndicator snapshot={saveSnapshot} className="mr-1" />
          {remainingSeconds !== null && <Timer seconds={remainingSeconds} />}
          {hasTranslations && (
            <button
              type="button"
              onClick={onToggleZh}
              aria-pressed={showZh}
              aria-label="Tampilkan terjemahan Mandarin"
              title="Terjemahan 中文"
              className={cn(
                "hidden size-9 place-items-center rounded-full border transition-colors sm:grid",
                showZh ? "border-accent bg-accent-soft text-accent" : "border-border text-fg-muted hover:text-fg",
              )}
            >
              <Languages aria-hidden className="size-4" />
            </button>
          )}
          <ThemeToggle className="hidden size-9 sm:inline-flex" />
          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenNavigator}
            aria-label={`Daftar soal, ${answered} dari ${total} terjawab`}
            className="lg:hidden"
          >
            <Grid3x3 aria-hidden className="size-4" />
            <span className="tabular-nums">
              {answered}/{total}
            </span>
          </Button>
          <Button size="sm" onClick={onSubmit} className="hidden sm:inline-flex">
            <Send aria-hidden className="size-4" /> Kumpulkan
          </Button>
        </div>
      </div>

      <div
        role="progressbar"
        aria-label="Progres jawaban"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={answered}
        className="bg-border/60 h-0.5 w-full"
      >
        <div
          className="bg-molten h-full shadow-[0_0_12px_var(--molten-to)] transition-[width] duration-500 ease-out-quint"
          style={{ width: `${progress}%` }}
        />
      </div>
    </header>
  );
}
