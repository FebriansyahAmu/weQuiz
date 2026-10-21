"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, MotionConfig, type PanInfo } from "motion/react";
import { ArrowLeft, ArrowRight, Flag, LoaderCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useAutosave } from "@/hooks/useAutosave";
import { useCountdown } from "@/hooks/useCountdown";
import { useExamKeyboard } from "@/hooks/useExamKeyboard";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { clearActiveAttempt, setActiveAttempt } from "@/lib/storage";
import type { AttemptSessionDTO } from "@/types/dto";
import { ExamHeader } from "./ExamHeader";
import { QuestionCard } from "./QuestionCard";
import { QuestionNavigator } from "./QuestionNavigator";
import { SubmitDialog } from "./SubmitDialog";

interface AnswerState {
  selected: string[];
  flagged: boolean;
}

const EMPTY_ANSWER: AnswerState = { selected: [], flagged: false };

const slide = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 28 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -28 }),
};

export function ExamRoom({ session }: { session: AttemptSessionDTO }) {
  const router = useRouter();
  const { questions } = session;
  const total = questions.length;

  const [answers, setAnswers] = useState<Record<string, AnswerState>>(() =>
    Object.fromEntries(session.answers.map((a) => [a.questionId, { selected: a.selectedOptionIds, flagged: a.flagged }])),
  );
  // Resume at the first unanswered question.
  const [index, setIndex] = useState(() => {
    const answered = new Set(session.answers.filter((a) => a.selectedOptionIds.length > 0).map((a) => a.questionId));
    const first = session.questions.findIndex((q) => !answered.has(q.id));
    return first === -1 ? 0 : first;
  });
  const [direction, setDirection] = useState(1);
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [timeUp, setTimeUp] = useState(false);
  const [showZh, setShowZh] = useState(true);

  const goToResult = useCallback(() => {
    clearActiveAttempt();
    router.replace(`/result/${session.id}`);
  }, [router, session.id]);

  // The server refused a save because the attempt is finished: show the result.
  const { queue, snapshot } = useAutosave(session.id, goToResult);

  useEffect(() => {
    setActiveAttempt({ id: session.id, name: session.participantName });
  }, [session.id, session.participantName]);

  const finish = async (reason: "submit" | "timeout") => {
    setSubmitting(true);
    setSubmitError(null);
    const allSaved = await queue.flush();
    if (!allSaved && reason === "submit") {
      setSubmitting(false);
      setSubmitError("Masih ada jawaban yang belum tersimpan. Periksa koneksi Anda, lalu coba lagi.");
      return;
    }
    try {
      await api.submit(session.id);
      queue.stop();
      goToResult();
    } catch (error) {
      // On timeout the server finalizes the attempt itself when the result is opened.
      if (reason === "timeout") return goToResult();
      setSubmitting(false);
      setSubmitError(error instanceof Error ? error.message : "Gagal mengumpulkan ujian.");
    }
  };

  const remaining = useCountdown(session.remainingSeconds, () => {
    setTimeUp(true);
    setSubmitOpen(false);
    setNavigatorOpen(false);
    void finish("timeout");
  });

  const question = questions[index];
  const current = answers[question.id] ?? EMPTY_ANSWER;
  const statusOf = (questionId: string) => {
    const answer = answers[questionId] ?? EMPTY_ANSWER;
    return { answered: answer.selected.length > 0, flagged: answer.flagged };
  };
  const answeredCount = questions.filter((q) => statusOf(q.id).answered).length;
  const unansweredIndexes = questions.flatMap((q, i) => (statusOf(q.id).answered ? [] : [i]));
  const flaggedIndexes = questions.flatMap((q, i) => (statusOf(q.id).flagged ? [i] : []));
  const isLast = index === total - 1;

  function updateAnswer(questionId: string, next: AnswerState, immediate = false) {
    setAnswers((prev) => ({ ...prev, [questionId]: next }));
    queue.enqueue(questionId, { selectedOptionIds: next.selected, flagged: next.flagged }, { immediate });
  }

  function toggleOption(optionId: string) {
    if (question.type !== "MULTIPLE" && current.selected[0] === optionId) return;
    const selected =
      question.type === "MULTIPLE"
        ? current.selected.includes(optionId)
          ? current.selected.filter((id) => id !== optionId)
          : [...current.selected, optionId]
        : [optionId];
    navigator.vibrate?.(8);
    updateAnswer(question.id, { ...current, selected });
  }

  function goTo(target: number) {
    if (target < 0 || target >= total || target === index) return;
    setDirection(target > index ? 1 : -1);
    setIndex(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handlePanEnd(event: PointerEvent, { offset, velocity }: PanInfo) {
    if (event.pointerType !== "touch") return;
    const horizontal = Math.abs(offset.x) > 70 && Math.abs(offset.x) > Math.abs(offset.y) * 1.5;
    if (!horizontal || (Math.abs(velocity.x) < 150 && Math.abs(offset.x) < 120)) return;
    goTo(offset.x < 0 ? index + 1 : index - 1);
  }

  useExamKeyboard(!navigatorOpen && !submitOpen && !timeUp, question.type === "TRUE_FALSE", {
    onSelect: (i) => {
      const option = question.options[i];
      if (option) toggleOption(option.id);
    },
    onPrev: () => goTo(index - 1),
    onNext: () => goTo(index + 1),
    onFlag: () => updateAnswer(question.id, { ...current, flagged: !current.flagged }, true),
  });

  const openSubmit = () => {
    setSubmitError(null);
    setSubmitOpen(true);
  };

  return (
    <MotionConfig reducedMotion="user">
      <ExamHeader
        participantName={session.participantName}
        answered={answeredCount}
        total={total}
        remainingSeconds={remaining}
        saveSnapshot={snapshot}
        hasTranslations={questions.some((q) => q.textZh)}
        showZh={showZh}
        onToggleZh={() => setShowZh((v) => !v)}
        onOpenNavigator={() => setNavigatorOpen(true)}
        onSubmit={openSubmit}
      />

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 pt-5 pb-36 sm:px-6 sm:pt-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10 lg:pb-16">
        <main className="flex min-w-0 flex-col gap-5">
          <motion.div onPanEnd={handlePanEnd} style={{ touchAction: "pan-y" }}>
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.div
                key={question.id}
                custom={direction}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <QuestionCard
                  question={question}
                  total={total}
                  selected={current.selected}
                  flagged={current.flagged}
                  showZh={showZh}
                  onToggleOption={toggleOption}
                  onClear={() => updateAnswer(question.id, { ...current, selected: [] })}
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <div
            className={cn(
              "bg-bg/90 border-border fixed inset-x-0 bottom-0 z-20 border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md",
              "lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none",
            )}
          >
            <div className="mx-auto flex max-w-6xl items-center gap-2">
              <Button variant="secondary" onClick={() => goTo(index - 1)} disabled={index === 0} aria-label="Soal sebelumnya">
                <ArrowLeft aria-hidden className="size-4" />
                <span className="max-sm:hidden">Sebelumnya</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => updateAnswer(question.id, { ...current, flagged: !current.flagged }, true)}
                aria-pressed={current.flagged}
                className={cn("mx-auto", current.flagged && "bg-info-soft text-info hover:bg-info-soft hover:text-info")}
              >
                <Flag aria-hidden className={cn("size-4", current.flagged && "fill-current")} />
                Ragu-ragu
              </Button>
              {isLast ? (
                <Button onClick={openSubmit}>
                  <Send aria-hidden className="size-4" /> Selesai
                </Button>
              ) : (
                <Button onClick={() => goTo(index + 1)} aria-label="Soal berikutnya">
                  <span className="max-sm:hidden">Berikutnya</span>
                  <ArrowRight aria-hidden className="size-4" />
                </Button>
              )}
            </div>
          </div>

          <p className="text-fg-subtle hidden gap-x-4 text-xs lg:flex">
            <span>
              <kbd className="font-sans">←</kbd> <kbd className="font-sans">→</kbd> pindah soal
            </span>
            <span>
              <kbd className="font-sans">1–5</kbd> / <kbd className="font-sans">A–E</kbd> pilih jawaban
            </span>
            <span>
              <kbd className="font-sans">B</kbd> / <kbd className="font-sans">S</kbd> benar / salah
            </span>
            <span>
              <kbd className="font-sans">R</kbd> ragu-ragu
            </span>
          </p>
        </main>

        <aside className="hidden lg:block">
          <div className="bg-surface border-border rounded-card shadow-card sticky top-24 border p-5">
            <QuestionNavigator questions={questions} status={statusOf} currentIndex={index} onJump={goTo} />
          </div>
        </aside>
      </div>

      <Dialog
        variant="sheet"
        open={navigatorOpen}
        onClose={() => setNavigatorOpen(false)}
        title="Daftar soal"
        description={`${answeredCount} dari ${total} soal terjawab`}
      >
        <QuestionNavigator
          questions={questions}
          status={statusOf}
          currentIndex={index}
          hideHeading
          onJump={(i) => {
            goTo(i);
            setNavigatorOpen(false);
          }}
        />
        <div className="bg-surface sticky -bottom-5 -mx-5 -mb-5 px-5 pt-3 pb-5 sm:-bottom-6 sm:-mx-6 sm:-mb-6 sm:px-6 sm:pb-6">
          <Button
            onClick={() => {
              setNavigatorOpen(false);
              openSubmit();
            }}
            className="w-full"
          >
            <Send aria-hidden className="size-4" /> Kumpulkan ujian
          </Button>
        </div>
      </Dialog>

      <SubmitDialog
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        total={total}
        answered={answeredCount}
        unansweredIndexes={unansweredIndexes}
        flaggedIndexes={flaggedIndexes}
        onJump={(i) => {
          goTo(i);
          setSubmitOpen(false);
        }}
        onConfirm={() => void finish("submit")}
        submitting={submitting}
        error={submitError}
      />

      <Dialog
        open={timeUp}
        onClose={() => {}}
        dismissible={false}
        title="Waktu habis"
        description="Jawaban yang sudah tersimpan sedang dikumpulkan. Anda akan diarahkan ke halaman hasil."
      >
        <LoaderCircle aria-hidden className="text-accent mx-auto size-8 animate-spin" />
      </Dialog>

      <p aria-live="polite" className="sr-only">
        Soal {index + 1} dari {total}
      </p>
    </MotionConfig>
  );
}
