"use client";

import { Check, X } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import type { PublicOptionDTO } from "@/types/dto";

interface OptionItemProps {
  questionId: string;
  option: PublicOptionDTO;
  selected: boolean;
  showZh: boolean;
  onToggle: () => void;
}

const focusRing =
  "has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-ring";

/** Radio (single choice) or checkbox (multi answer) card. Circle vs square badge tells them apart. */
export function ChoiceOption({
  questionId,
  option,
  selected,
  showZh,
  onToggle,
  multiple,
}: OptionItemProps & { multiple: boolean }) {
  return (
    <label
      className={cn(
        "group relative flex min-h-14 cursor-pointer items-start gap-3.5 rounded-2xl border p-3.5 pr-4 sm:p-4",
        "transition-[border-color,background-color,box-shadow] duration-200 ease-out-quint",
        focusRing,
        selected
          ? "border-accent bg-accent-soft shadow-[inset_0_0_0_1px_var(--accent)]"
          : "border-border bg-surface hover:border-border-strong hover:bg-surface-2/60",
      )}
    >
      <input
        type={multiple ? "checkbox" : "radio"}
        name={`q-${questionId}`}
        value={option.id}
        checked={selected}
        onChange={onToggle}
        className="sr-only"
      />
      <motion.span
        aria-hidden
        initial={false}
        animate={{ scale: selected ? [1, 1.16, 1] : 1 }}
        transition={{ duration: 0.28 }}
        className={cn(
          "font-display grid size-8 shrink-0 place-items-center border text-sm font-semibold transition-colors duration-200",
          multiple ? "rounded-lg" : "rounded-full",
          selected
            ? "bg-molten text-on-molten border-transparent"
            : "border-border-strong text-fg-muted group-hover:text-fg",
        )}
      >
        {multiple && selected ? <Check className="size-4" strokeWidth={3} /> : option.label}
      </motion.span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 pt-[0.3rem] leading-relaxed">
        <span className="text-[0.975rem] sm:text-base">{option.text}</span>
        {showZh && option.textZh && (
          <span lang="zh" className="text-fg-muted text-sm">
            {option.textZh}
          </span>
        )}
      </span>
    </label>
  );
}

/** Large tile for true/false statements. Both states use the neutral accent so color never hints correctness. */
export function TrueFalseOption({
  questionId,
  option,
  selected,
  showZh,
  onToggle,
  isTrue,
}: OptionItemProps & { isTrue: boolean }) {
  const Icon = isTrue ? Check : X;
  return (
    <label
      className={cn(
        "group relative flex min-h-32 flex-1 cursor-pointer flex-col items-center justify-center gap-2.5 rounded-2xl border p-5",
        "transition-[border-color,background-color,box-shadow] duration-200 ease-out-quint",
        focusRing,
        selected
          ? "border-accent bg-accent-soft shadow-[inset_0_0_0_1px_var(--accent)]"
          : "border-border bg-surface hover:border-border-strong hover:bg-surface-2/60",
      )}
    >
      <input
        type="radio"
        name={`q-${questionId}`}
        value={option.id}
        checked={selected}
        onChange={onToggle}
        className="sr-only"
      />
      <motion.span
        aria-hidden
        initial={false}
        animate={{ scale: selected ? [1, 1.14, 1] : 1, rotate: selected ? [0, isTrue ? -8 : 8, 0] : 0 }}
        transition={{ duration: 0.32 }}
        className={cn(
          "grid size-12 place-items-center rounded-full border transition-colors duration-200",
          selected ? "bg-molten text-on-molten border-transparent" : "border-border-strong text-fg-muted",
        )}
      >
        <Icon className="size-6" strokeWidth={2.5} />
      </motion.span>
      <span className="font-display text-lg font-semibold">{option.text}</span>
      {showZh && option.textZh && (
        <span lang="zh" className="text-fg-muted -mt-1.5 text-sm">
          {option.textZh}
        </span>
      )}
      <kbd className="border-border text-fg-subtle absolute top-2.5 right-3 hidden rounded border px-1.5 font-sans text-[0.7rem] sm:block">
        {isTrue ? "B" : "S"}
      </kbd>
    </label>
  );
}
