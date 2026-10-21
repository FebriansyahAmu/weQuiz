import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";
import { entityIdSchema } from "@/lib/validation/exam";
import { AppError } from "@/server/errors";
import { getAttemptResult } from "@/server/services/attempt.service";

export const metadata: Metadata = { title: "Hasil ujian" };

// Interim result page for Tahap 3; the full result + review experience lands in Tahap 4.
export default function ResultPage({ params }: PageProps<"/result/[attemptId]">) {
  return (
    <Suspense fallback={<div aria-busy="true" className="flex-1" />}>
      <ResultLoader params={params} />
    </Suspense>
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

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-8 px-5 py-16 text-center">
      <div className="flex flex-col gap-2">
        <p className="text-accent font-display text-sm font-medium tracking-[0.18em] uppercase">
          {result.status === "EXPIRED" ? "Waktu habis" : "Ujian selesai"}
        </p>
        <h1 className="font-display text-2xl font-semibold">{result.participantName}</h1>
      </div>
      <p className="font-display text-molten text-7xl font-semibold tabular-nums">
        {result.score.toLocaleString("id-ID", { maximumFractionDigits: 1 })}
        <span className="text-4xl">%</span>
      </p>
      <dl className="grid w-full grid-cols-3 gap-3">
        {[
          { label: "Benar", value: result.correct },
          { label: "Salah", value: result.wrong },
          { label: "Kosong", value: result.unanswered },
        ].map((stat) => (
          <div key={stat.label} className="bg-surface border-border rounded-2xl border p-4">
            <dt className="text-fg-muted text-sm">{stat.label}</dt>
            <dd className="font-display text-2xl font-semibold tabular-nums">{stat.value}</dd>
          </div>
        ))}
      </dl>
      <Link href="/" className={buttonClass({ size: "lg" })}>
        <RotateCcw aria-hidden className="size-4" /> Ujian lagi
      </Link>
    </main>
  );
}
