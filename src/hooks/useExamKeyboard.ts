"use client";

import { useEffect, useEffectEvent } from "react";

export interface ExamKeyboardHandlers {
  /** Select the option at this index (0-based). */
  onSelect: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onFlag: () => void;
}

const LETTERS = ["a", "b", "c", "d", "e"];

/**
 * Exam shortcuts: 1–5 / A–E select an option, B / S answer true/false,
 * ← / → move between questions, R toggles "ragu-ragu".
 */
export function useExamKeyboard(enabled: boolean, isTrueFalse: boolean, handlers: ExamKeyboardHandlers) {
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;

    const target = event.target as HTMLElement | null;
    if (target?.closest("input[type=text], textarea, select, [contenteditable=true], dialog[open]")) return;

    const key = event.key.toLowerCase();
    let handled = true;

    // ←/→ always change question. preventDefault below also stops a focused radio
    // from moving its selection (which would silently change the answer);
    // ↑/↓ keep the native radio-group behavior.
    if (key === "arrowleft") handlers.onPrev();
    else if (key === "arrowright") handlers.onNext();
    else if (key === "r") handlers.onFlag();
    else if (isTrueFalse && key === "b") handlers.onSelect(0);
    else if (isTrueFalse && key === "s") handlers.onSelect(1);
    else if (/^[1-5]$/.test(key)) handlers.onSelect(Number(key) - 1);
    else if (!isTrueFalse && LETTERS.includes(key)) handlers.onSelect(LETTERS.indexOf(key));
    else handled = false;

    if (handled) event.preventDefault();
  });

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
