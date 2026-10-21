"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { History, ArrowRight } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api-client";
import { clearActiveAttempt, getActiveAttempt } from "@/lib/storage";

interface ResumeInfo {
  id: string;
  name: string;
  answered: number;
  total: number;
  remainingMinutes: number | null;
}

/** Offers to continue an unfinished exam started on this device. */
export function ResumeBanner() {
  const [resume, setResume] = useState<ResumeInfo | null>(null);

  useEffect(() => {
    const active = getActiveAttempt();
    if (!active) return;
    let cancelled = false;

    api
      .getAttempt(active.id)
      .then((session) => {
        if (cancelled) return;
        if (session.status !== "IN_PROGRESS") {
          clearActiveAttempt();
          return;
        }
        setResume({
          id: session.id,
          name: session.participantName,
          answered: session.answers.filter((a) => a.selectedOptionIds.length > 0).length,
          total: session.questions.length,
          remainingMinutes: session.remainingSeconds === null ? null : Math.ceil(session.remainingSeconds / 60),
        });
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 404) clearActiveAttempt();
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!resume) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="border-accent/40 bg-accent-soft flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center"
    >
      <span className="bg-molten text-on-molten grid size-10 shrink-0 place-items-center rounded-xl">
        <History aria-hidden className="size-5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="font-display font-semibold">Ujian Anda belum selesai</p>
        <p className="text-fg-muted truncate text-sm">
          {resume.name} · {resume.answered}/{resume.total} terjawab
          {resume.remainingMinutes !== null && ` · sisa ${resume.remainingMinutes} menit`}
        </p>
      </div>
      <Link href={`/exam/${resume.id}`} className={buttonClass({ size: "sm" })}>
        Lanjutkan <ArrowRight aria-hidden className="size-4" />
      </Link>
    </motion.div>
  );
}
