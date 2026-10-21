"use client";

import { useId } from "react";
import { Eraser, Flag, Info } from "lucide-react";
import { QUESTION_TYPE_LABEL, type QuestionTypeValue } from "@/lib/domain";
import type { PublicQuestionDTO } from "@/types/dto";
import { HighlightedText } from "./HighlightedText";
import { ChoiceOption, TrueFalseOption } from "./OptionItem";

const TYPE_HINT: Record<QuestionTypeValue, string> = {
  SINGLE: "Pilih satu jawaban yang paling tepat.",
  MULTIPLE: "Pilih semua jawaban yang benar. Nilai penuh hanya jika semua pilihan tepat.",
  TRUE_FALSE: "Tentukan apakah pernyataan ini benar atau salah.",
};

interface QuestionCardProps {
  question: PublicQuestionDTO;
  total: number;
  selected: string[];
  flagged: boolean;
  showZh: boolean;
  onToggleOption: (optionId: string) => void;
  onClear: () => void;
}

export function QuestionCard({ question, total, selected, flagged, showZh, onToggleOption, onClear }: QuestionCardProps) {
  const headingId = useId();
  const isTrueFalse = question.type === "TRUE_FALSE";

  return (
    <article
      aria-labelledby={headingId}
      className="bg-surface border-border rounded-card shadow-card flex flex-col gap-5 border p-5 sm:gap-6 sm:p-7"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-display text-fg-muted text-sm font-medium tabular-nums">
          Soal <span className="text-fg">{question.position + 1}</span> / {total}
        </span>
        <span className="bg-surface-2 text-fg-muted rounded-full px-2.5 py-0.5 text-xs font-medium">
          {QUESTION_TYPE_LABEL[question.type]}
        </span>
        {flagged && (
          <span className="bg-info-soft text-info inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium">
            <Flag aria-hidden className="size-3" /> Ragu-ragu
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h2 id={headingId} className="text-lg leading-relaxed font-medium text-pretty sm:text-xl sm:leading-relaxed">
          <HighlightedText text={question.text} />
        </h2>
        {showZh && question.textZh && (
          <p lang="zh" className="text-fg-muted leading-relaxed">
            {question.textZh}
          </p>
        )}
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-fg-subtle mb-3 flex items-center gap-1.5 text-sm">
          <Info aria-hidden className="size-4 shrink-0" />
          {TYPE_HINT[question.type]}
        </legend>

        {isTrueFalse ? (
          <div className="flex gap-3">
            {question.options.map((option, index) => (
              <TrueFalseOption
                key={option.id}
                questionId={question.id}
                option={option}
                isTrue={index === 0}
                selected={selected.includes(option.id)}
                showZh={showZh}
                onToggle={() => onToggleOption(option.id)}
              />
            ))}
          </div>
        ) : (
          question.options.map((option) => (
            <ChoiceOption
              key={option.id}
              questionId={question.id}
              option={option}
              multiple={question.type === "MULTIPLE"}
              selected={selected.includes(option.id)}
              showZh={showZh}
              onToggle={() => onToggleOption(option.id)}
            />
          ))
        )}
      </fieldset>

      {selected.length > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="text-fg-subtle hover:text-fg -mt-2 inline-flex items-center gap-1.5 self-start rounded-full py-1 text-sm transition-colors"
        >
          <Eraser aria-hidden className="size-4" /> Kosongkan jawaban
        </button>
      )}
    </article>
  );
}
