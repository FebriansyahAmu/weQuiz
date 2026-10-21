import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BookOpenCheck, CalendarClock, Layers, RotateCcw, TimerOff } from "lucide-react";
import { ResultSkeleton } from "@/components/result/ResultSkeleton";
import { ScoreRing } from "@/components/result/ScoreRing";
import { StatGrid } from "@/components/result/StatGrid";
import { TypeBreakdown } from "@/components/result/TypeBreakdown";
import { buttonClass } from "@/components/ui/Button";
import { LocalDateTime } from "@/components/ui/LocalDateTime";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { getPreset } from "@/config/exam-presets";
import { getScoreBand, type ScoreTone } from "@/config/grading";
import { cn } from "@/lib/cn";
import { entityIdSchema } from "@/lib/validation/exam";
import { AppError } from "@/server/errors";
import { getAttemptResult } from "@/server/services/attempt.service";

export const metadata: Metadata = { title: "Hasil ujian" };

const BAND_TONE: Record<ScoreTone, string> = {
  success: "bg-success-soft text-success",
  accent: "bg-accent-soft text-accent",
  info: "bg-info-soft text-info",
  danger: "bg-danger-soft text-danger",
};

const reveal = "transition-[opacity,translate] duration-700 ease-out-quint starting:translate-y-3 starting:opacity-0";

export default function ResultPage({ params }: PageProps<"/result/[attemptId]">) {
  return (
    <>
      <div aria-hidden className="bg-molten fixed inset-x-0 top-0 z-50 h-0.5" />
      <SiteHeader />
      <Suspense fallback={<ResultSkeleton />}>
        <ResultLoader params={params} />
      </Suspense>
    </>
  );
}

async function ResultLoader({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  if (!entityIdSchema.safeParse(attemptId).success) notFound();

  let result;
  try {
    result = await getAttemptResult(attemptId);
  } catch (error) {
    if (error instanceof AppError && error.code === "ATTEMPT_NOT_FOUND") notFound();
    if (error instanceof AppError && error.code === "ATTEMPT_NOT_FINISHED") redirect(`/exam/${attemptId}`);
    throw error;
  }

  const band = getScoreBand(result.score);
  const preset = getPreset(result.presetKey);
  const expired = result.status === "EXPIRED";

  return (
    <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-5 pb-16 sm:px-8">
      <section
        aria-labelledby="result-heading"
        className={cn(
          "bg-surface border-border rounded-card shadow-lift relative overflow-hidden border p-6 sm:p-8",
          reveal,
        )}
      >
        {/* Warm glow behind the gauge. */}
        <div
          aria-hidden
          className="bg-molten pointer-events-none absolute -top-24 -left-24 size-72 rounded-full opacity-[0.12] blur-3xl sm:-left-16"
        />

        <div className="relative flex flex-col items-center gap-7 text-center sm:flex-row sm:items-center sm:gap-10 sm:text-left">
          <ScoreRing score={result.score} className="w-48 shrink-0 sm:w-52" />

          <div className="flex min-w-0 flex-1 flex-col items-center gap-4 sm:items-start">
            <div className="flex flex-col gap-1.5">
              <p className="text-accent font-display flex items-center justify-center gap-1.5 text-sm font-medium tracking-[0.18em] uppercase sm:justify-start">
                {expired && <TimerOff aria-hidden className="size-4" />}
                {expired ? "Waktu habis" : "Ujian selesai"}
              </p>
              <h1 id="result-heading" className="font-display text-2xl font-semibold tracking-tight wrap-break-word sm:text-3xl">
                {result.participantName}
              </h1>
              <p className="text-fg-muted flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm sm:justify-start">
                <span className="inline-flex items-center gap-1.5">
                  <Layers aria-hidden className="size-4" /> Paket {preset?.label ?? result.presetKey} · {result.total} soal
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock aria-hidden className="size-4" />
                  <LocalDateTime iso={result.submittedAt} />
                </span>
              </p>
            </div>

            <div className="flex flex-col items-center gap-1.5 sm:items-start">
              <span className={cn("font-display rounded-full px-3 py-1 text-sm font-semibold", BAND_TONE[band.tone])}>
                {band.label}
              </span>
              <p className="text-fg-muted text-sm text-pretty">
                {band.message}
                {expired && " Jawaban yang sudah tersimpan saat waktu habis tetap dinilai."}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 pt-1 sm:w-auto sm:flex-row">
              <Link href={`/result/${result.id}/review`} className={buttonClass({ size: "lg" })}>
                <BookOpenCheck aria-hidden className="size-4" /> Lihat pembahasan
              </Link>
              <Link href="/" className={buttonClass({ variant: "secondary", size: "lg" })}>
                <RotateCcw aria-hidden className="size-4" /> Ujian lagi
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Ringkasan jawaban" className={cn(reveal, "delay-100")}>
        <StatGrid result={result} />
      </section>

      <section
        aria-labelledby="breakdown-heading"
        className={cn("bg-surface border-border rounded-card flex flex-col gap-5 border p-5 sm:p-7", reveal, "delay-200")}
      >
        <div className="flex flex-col gap-1">
          <h2 id="breakdown-heading" className="font-display text-lg font-semibold">
            Rincian per tipe soal
          </h2>
          <p className="text-fg-muted text-sm">
            Multi Jawaban hanya dihitung benar jika semua pilihan tepat. Soal kosong dihitung salah.
          </p>
        </div>
        <TypeBreakdown byType={result.byType} />
      </section>
    </main>
  );
}
