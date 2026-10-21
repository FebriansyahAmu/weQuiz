"use client";

import { useActionState, useEffect, useRef } from "react";
import { AlertTriangle, ArrowRight, Check, Clock, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DEFAULT_PRESET_KEY, EXAM_PRESETS, type Composition } from "@/config/exam-presets";
import { cn } from "@/lib/cn";
import { getLastName, setLastName } from "@/lib/storage";
import { startExam, type StartExamState } from "@/server/actions/start-exam";

function questionCount(composition: Composition) {
  if (composition === "ALL") return "Semua soal";
  const total = Object.values(composition).reduce((sum, n) => sum + n, 0);
  return `${total} soal`;
}

export function StartExamForm() {
  const [state, formAction, pending] = useActionState<StartExamState, FormData>(startExam, {});
  const nameRef = useRef<HTMLInputElement>(null);
  const nameError = state.fieldErrors?.name?.[0];
  const presetError = state.fieldErrors?.presetKey?.[0];
  const selectedPreset = state.values?.presetKey ?? DEFAULT_PRESET_KEY;

  // Prefill the name used last time on this device. Autofocus only with a mouse:
  // on phones it would scroll past the hero and pop up the keyboard.
  useEffect(() => {
    const input = nameRef.current;
    if (!input) return;
    const last = getLastName();
    if (last && !input.value) input.value = last;
    if (window.matchMedia("(pointer: fine)").matches) input.focus({ preventScroll: true });
  }, []);

  return (
    <form
      action={formAction}
      onSubmit={() => {
        const name = nameRef.current?.value.trim();
        if (name) setLastName(name);
      }}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="font-display text-sm font-semibold">
          Nama lengkap
        </label>
        <input
          ref={nameRef}
          id="name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={80}
          autoComplete="name"
          placeholder="mis. Budi Santoso"
          defaultValue={state.values?.name}
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? "name-error" : undefined}
          className={cn(
            "bg-surface h-14 rounded-2xl border px-4 text-lg transition-[border-color,box-shadow] outline-none",
            "placeholder:text-fg-subtle focus:border-accent focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--ring)_18%,transparent)]",
            nameError ? "border-danger" : "border-border hover:border-border-strong",
          )}
        />
        {nameError && (
          <p id="name-error" className="text-danger text-sm">
            {nameError}
          </p>
        )}
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="font-display mb-2 text-sm font-semibold">Paket ujian</legend>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {EXAM_PRESETS.map((preset) => (
            <label
              key={preset.key}
              className={cn(
                "group bg-surface border-border relative flex cursor-pointer flex-col gap-2 rounded-2xl border p-4",
                "transition-[border-color,background-color,box-shadow] duration-200",
                "hover:border-border-strong has-checked:border-accent has-checked:bg-accent-soft has-checked:shadow-[inset_0_0_0_1px_var(--accent)]",
                "has-[input:focus-visible]:outline-ring has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2",
                preset.key === DEFAULT_PRESET_KEY && "sm:col-span-2",
              )}
            >
              <input
                type="radio"
                name="presetKey"
                value={preset.key}
                defaultChecked={preset.key === selectedPreset}
                className="sr-only"
              />
              <span className="flex items-center justify-between gap-2">
                <span className="font-display font-semibold">{preset.label}</span>
                <span
                  aria-hidden
                  className="border-border-strong group-has-checked:bg-molten group-has-checked:text-on-molten grid size-5 place-items-center rounded-full border text-transparent transition-colors group-has-checked:border-transparent"
                >
                  <Check className="size-3" strokeWidth={3.5} />
                </span>
              </span>
              <span className="text-fg-muted text-sm">{preset.description}</span>
              <span className="text-fg-subtle flex flex-wrap gap-x-3 gap-y-1 text-xs">
                <span className="inline-flex items-center gap-1">
                  <ListChecks aria-hidden className="size-3.5" /> {questionCount(preset.composition)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock aria-hidden className="size-3.5" />
                  {preset.durationMinutes ? `${preset.durationMinutes} menit` : "Tanpa batas waktu"}
                </span>
              </span>
            </label>
          ))}
        </div>
        {presetError && <p className="text-danger text-sm">{presetError}</p>}
      </fieldset>

      {state.message && (
        <p role="alert" className="bg-danger-soft text-danger flex items-start gap-2 rounded-xl p-3 text-sm">
          <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
          {state.message}
        </p>
      )}

      <Button type="submit" size="lg" loading={pending} className="w-full">
        {pending ? "Menyiapkan soal…" : "Mulai Ujian"}
        {!pending && <ArrowRight aria-hidden className="size-4" />}
      </Button>
    </form>
  );
}
