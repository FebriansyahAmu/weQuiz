import { Check, CheckCircle2, CircleDashed, Flag, X, XCircle } from "lucide-react";
import { HighlightedText } from "@/components/exam/HighlightedText";
import { cn } from "@/lib/cn";
import { QUESTION_TYPE_LABEL } from "@/lib/domain";
import type { ReviewOptionDTO, ReviewQuestionDTO } from "@/types/dto";

/** hit = chosen & correct, missed = correct but not chosen, wrong = chosen but not correct. */
type OptionState = "hit" | "missed" | "wrong" | "neutral";

function optionState(option: ReviewOptionDTO, chosen: boolean): OptionState {
  if (option.isCorrect) return chosen ? "hit" : "missed";
  return chosen ? "wrong" : "neutral";
}

const ROW_CLASS: Record<OptionState, string> = {
  hit: "border-success bg-success-soft",
  missed: "border-success border-dashed",
  wrong: "border-danger bg-danger-soft",
  neutral: "border-border text-fg-muted",
};

const BADGE_CLASS: Record<OptionState, string> = {
  hit: "bg-success text-bg border-transparent",
  missed: "border-success text-success",
  wrong: "bg-danger text-bg border-transparent",
  neutral: "border-border-strong text-fg-subtle",
};

function Tag({ tone, children }: { tone: "success" | "danger" | "neutral"; children: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[0.7rem] font-semibold tracking-wide whitespace-nowrap uppercase",
        tone === "success" && "bg-success text-bg",
        tone === "danger" && "bg-danger text-bg",
        tone === "neutral" && "bg-surface-2 text-fg-muted",
      )}
    >
      {children}
    </span>
  );
}

function ReviewOption({
  option,
  chosen,
  multiple,
  trueFalse,
  showZh,
}: {
  option: ReviewOptionDTO;
  chosen: boolean;
  multiple: boolean;
  trueFalse: boolean;
  showZh: boolean;
}) {
  const state = optionState(option, chosen);
  const badge = state === "hit" ? <Check className="size-4" strokeWidth={3} /> : state === "wrong" ? <X className="size-4" strokeWidth={3} /> : trueFalse ? option.text[0] : option.label;

  return (
    <li className={cn("flex items-start gap-3 rounded-2xl border p-3 sm:p-3.5", ROW_CLASS[state])}>
      <span
        aria-hidden
        className={cn(
          "font-display grid size-7 shrink-0 place-items-center border text-xs font-semibold",
          multiple ? "rounded-lg" : "rounded-full",
          BADGE_CLASS[state],
        )}
      >
        {badge}
      </span>
      {/* Tags sit under the text on phones so long options keep their width; beside it from sm up. */}
      <span className="flex min-w-0 flex-1 flex-col gap-1.5 pt-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <span className="flex min-w-0 flex-col gap-0.5 leading-relaxed">
          <span className={cn("text-[0.95rem]", state !== "neutral" && "text-fg", trueFalse && "font-display font-semibold")}>
            {!trueFalse && <span className="sr-only">{option.label}. </span>}
            {option.text}
          </span>
          {showZh && option.textZh && (
            <span lang="zh" className="text-fg-muted text-sm">
              {option.textZh}
            </span>
          )}
        </span>
        {(option.isCorrect || chosen) && (
          <span className="flex shrink-0 flex-wrap gap-1 sm:justify-end sm:pt-0.5">
            {chosen && <Tag tone={option.isCorrect ? "neutral" : "danger"}>Pilihan Anda</Tag>}
            {option.isCorrect && <Tag tone="success">Kunci</Tag>}
          </span>
        )}
      </span>
    </li>
  );
}

function answerText(question: ReviewQuestionDTO, options: ReviewOptionDTO[]) {
  if (options.length === 0) return "—";
  return options.map((o) => (question.type === "TRUE_FALSE" ? o.text : o.label)).join(", ");
}

interface ReviewItemProps {
  question: ReviewQuestionDTO;
  showZh: boolean;
  highlighted: boolean;
}

export function ReviewItem({ question, showZh, highlighted }: ReviewItemProps) {
  const number = question.position + 1;
  const chosen = new Set(question.selectedOptionIds);
  const answered = chosen.size > 0;
  const trueFalse = question.type === "TRUE_FALSE";
  const status = question.isCorrect ? "correct" : answered ? "wrong" : "empty";
  const keys = question.options.filter((o) => o.isCorrect);
  const picks = question.options.filter((o) => chosen.has(o.id));
  const headingId = `soal-${number}-heading`;

  return (
    <article
      id={`soal-${number}`}
      tabIndex={-1}
      aria-labelledby={headingId}
      className={cn(
        "bg-surface border-border rounded-card relative flex scroll-mt-24 flex-col gap-4 overflow-hidden border p-5 outline-none sm:p-6",
        "transition-shadow duration-500",
        highlighted && "ring-ring ring-offset-bg ring-2 ring-offset-2",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          status === "correct" && "bg-success",
          status === "wrong" && "bg-danger",
          status === "empty" && "bg-border-strong",
        )}
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-display text-sm font-semibold tabular-nums">Soal {number}</span>
        <span className="bg-surface-2 text-fg-muted rounded-full px-2.5 py-0.5 text-xs font-medium">
          {QUESTION_TYPE_LABEL[question.type]}
        </span>
        {question.flagged && (
          <span className="bg-info-soft text-info inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium">
            <Flag aria-hidden className="size-3" /> Ragu-ragu
          </span>
        )}
        <span
          className={cn(
            "ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
            status === "correct" && "bg-success-soft text-success",
            status === "wrong" && "bg-danger-soft text-danger",
            status === "empty" && "bg-surface-2 text-fg-muted",
          )}
        >
          {status === "correct" && <CheckCircle2 aria-hidden className="size-3.5" />}
          {status === "wrong" && <XCircle aria-hidden className="size-3.5" />}
          {status === "empty" && <CircleDashed aria-hidden className="size-3.5" />}
          {status === "correct" ? "Benar" : status === "wrong" ? "Salah" : "Tidak dijawab"}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 id={headingId} className="leading-relaxed font-medium text-pretty sm:text-lg sm:leading-relaxed">
          <HighlightedText text={question.text} />
        </h3>
        {showZh && question.textZh && (
          <p lang="zh" className="text-fg-muted text-sm leading-relaxed">
            {question.textZh}
          </p>
        )}
      </div>

      <ul className={cn("grid gap-2", trueFalse && "sm:grid-cols-2")}>
        {question.options.map((option) => (
          <ReviewOption
            key={option.id}
            option={option}
            chosen={chosen.has(option.id)}
            multiple={question.type === "MULTIPLE"}
            trueFalse={trueFalse}
            showZh={showZh}
          />
        ))}
      </ul>

      {status !== "correct" && (
        <p className="bg-surface-2 text-fg-muted flex flex-wrap gap-x-4 gap-y-1 rounded-xl px-3.5 py-2.5 text-sm">
          <span>
            Kunci: <span className="text-success font-semibold">{answerText(question, keys)}</span>
          </span>
          <span>
            Jawaban Anda:{" "}
            <span className={cn("font-semibold", answered ? "text-danger" : "text-fg-muted")}>
              {answered ? answerText(question, picks) : "tidak dijawab"}
            </span>
          </span>
        </p>
      )}
    </article>
  );
}
