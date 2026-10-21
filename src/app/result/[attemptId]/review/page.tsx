import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { ReviewExplorer } from "@/components/review/ReviewExplorer";
import { buttonClass } from "@/components/ui/Button";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { formatScore } from "@/lib/format";
import { entityIdSchema } from "@/lib/validation/exam";
import { AppError } from "@/server/errors";
import { getAttemptReview } from "@/server/services/attempt.service";

export const metadata: Metadata = { title: "Pembahasan" };

export default function ReviewPage({ params }: PageProps<"/result/[attemptId]/review">) {
  return (
    <>
      <div aria-hidden className="bg-molten fixed inset-x-0 top-0 z-50 h-0.5" />
      <SiteHeader />
      <Suspense fallback={<ReviewSkeleton />}>
        <ReviewLoader params={params} />
      </Suspense>
    </>
  );
}

async function ReviewLoader({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  if (!entityIdSchema.safeParse(attemptId).success) notFound();

  let review;
  try {
    review = await getAttemptReview(attemptId);
  } catch (error) {
    if (error instanceof AppError && error.code === "ATTEMPT_NOT_FOUND") notFound();
    if (error instanceof AppError && error.code === "ATTEMPT_NOT_FINISHED") redirect(`/exam/${attemptId}`);
    throw error;
  }

  return (
    <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-20 sm:px-8">
      <div className="flex flex-col gap-5 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <Link
            href={`/result/${review.attemptId}`}
            className="text-fg-muted hover:text-fg inline-flex items-center gap-1.5 self-start rounded-full text-sm transition-colors"
          >
            <ArrowLeft aria-hidden className="size-4" /> Kembali ke hasil
          </Link>
          <p className="text-accent font-display text-sm font-medium tracking-[0.18em] uppercase">Pembahasan</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight wrap-break-word sm:text-3xl">
            {review.participantName}
            <span className="text-fg-muted font-normal"> · </span>
            <span className="text-molten tabular-nums">{formatScore(review.score)}%</span>
          </h1>
          <p className="text-fg-muted text-sm">
            Jawaban Anda dibandingkan dengan kunci. Kunci ditandai hijau, pilihan yang salah ditandai merah.
          </p>
        </div>
        <Link href="/" className={buttonClass({ variant: "secondary", className: "self-start sm:self-auto" })}>
          <RotateCcw aria-hidden className="size-4" /> Ujian lagi
        </Link>
      </div>

      <ReviewExplorer review={review} />
    </main>
  );
}

function ReviewSkeleton() {
  const shimmer = "bg-surface-2 animate-pulse rounded-xl";
  return (
    <div aria-busy="true" aria-label="Memuat pembahasan" className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 sm:px-8">
      <div className={`${shimmer} h-4 w-32`} />
      <div className={`${shimmer} h-8 w-72 max-w-full`} />
      <div className={`${shimmer} mb-4 h-4 w-96 max-w-full`} />
      <div className="flex gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={`${shimmer} h-9 w-24 rounded-full`} />
        ))}
      </div>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className={`${shimmer} rounded-card h-64`} />
      ))}
    </div>
  );
}
