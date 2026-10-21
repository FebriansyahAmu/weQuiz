"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** "center" modal, or "sheet": a bottom sheet on small screens, centered from sm up. */
  variant?: "center" | "sheet";
  /** Blocking dialogs ignore Esc / backdrop clicks and hide the close button. */
  dismissible?: boolean;
  className?: string;
}

/**
 * Native <dialog> modal: focus trapping, Esc handling and inertness of the page
 * come from the platform. Enter/exit transitions use @starting-style.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  variant = "center",
  dismissible = true,
  className,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        if (dismissible) onClose();
      }}
      onClick={(event) => {
        if (dismissible && event.target === event.currentTarget) onClose();
      }}
      className={cn(
        "bg-surface text-fg border-border m-auto max-h-[min(88dvh,46rem)] w-[min(100%-2rem,30rem)] overflow-y-auto rounded-card border p-0 shadow-lift",
        "backdrop:bg-[rgb(10_10_12/0.55)] backdrop:backdrop-blur-[3px]",
        "transition-[opacity,translate,scale,overlay,display] transition-discrete duration-250 ease-out-quint",
        "opacity-0 open:opacity-100 starting:open:opacity-0",
        "backdrop:transition-[opacity,overlay,display] backdrop:transition-discrete backdrop:duration-250 backdrop:opacity-0 open:backdrop:opacity-100 starting:open:backdrop:opacity-0",
        variant === "center" && "scale-95 open:scale-100 starting:open:scale-95",
        variant === "sheet" &&
          "max-sm:mx-0 max-sm:mb-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none max-sm:translate-y-8 max-sm:open:translate-y-0 max-sm:starting:open:translate-y-8 sm:scale-95 sm:open:scale-100 sm:starting:open:scale-95",
        className,
      )}
    >
      {open && (
        <div className="flex flex-col gap-5 p-5 sm:p-6">
          {variant === "sheet" && <span aria-hidden className="bg-border-strong mx-auto -mt-1 h-1 w-10 rounded-full sm:hidden" />}
          <header className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <h2 id={titleId} className="font-display text-xl font-semibold tracking-tight">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="text-fg-muted text-sm leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            {dismissible && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup"
                className="text-fg-muted hover:bg-surface-2 hover:text-fg -m-1.5 grid size-9 shrink-0 place-items-center rounded-full transition-colors"
              >
                <X aria-hidden className="size-5" />
              </button>
            )}
          </header>
          {children}
        </div>
      )}
    </dialog>
  );
}
