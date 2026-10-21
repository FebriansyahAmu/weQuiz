import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ExamRoom } from "@/components/exam/ExamRoom";
import { ExamSkeleton } from "@/components/exam/ExamSkeleton";
import { entityIdSchema } from "@/lib/validation/exam";
import { AppError } from "@/server/errors";
import { getAttemptSession } from "@/server/services/attempt.service";

export const metadata: Metadata = { title: "Ujian" };

// Not async: the params-dependent part streams behind Suspense (Cache Components).
export default function ExamPage({ params }: PageProps<"/exam/[attemptId]">) {
  return (
    <Suspense fallback={<ExamSkeleton />}>
      <ExamLoader params={params} />
    </Suspense>
  );
}

async function ExamLoader({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  if (!entityIdSchema.safeParse(attemptId).success) notFound();

  let session;
  try {
    session = await getAttemptSession(attemptId);
  } catch (error) {
    if (error instanceof AppError && error.code === "ATTEMPT_NOT_FOUND") notFound();
    throw error;
  }

  if (session.status !== "IN_PROGRESS") redirect(`/result/${attemptId}`);
  return <ExamRoom session={session} />;
}
