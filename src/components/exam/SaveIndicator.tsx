import { CloudAlert, CloudCheck, CloudOff, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import type { AutosaveSnapshot } from "@/lib/autosave-queue";

export function SaveIndicator({ snapshot, className }: { snapshot: AutosaveSnapshot; className?: string }) {
  const { status, errorMessage } = snapshot;
  if (status === "idle") return null;

  const view =
    status === "pending" || status === "saving"
      ? { icon: <LoaderCircle className="size-4 animate-spin" />, text: "Menyimpan…", tone: "text-fg-muted" }
      : status === "saved"
        ? { icon: <CloudCheck className="size-4" />, text: "Tersimpan", tone: "text-success" }
        : status === "retrying"
          ? { icon: <CloudOff className="size-4" />, text: "Offline, mencoba lagi", tone: "text-accent" }
          : { icon: <CloudAlert className="size-4" />, text: "Gagal menyimpan", tone: "text-danger" };

  return (
    <p
      role="status"
      aria-live="polite"
      title={errorMessage ?? undefined}
      className={cn("inline-flex items-center gap-1.5 text-sm font-medium", view.tone, className)}
    >
      <span aria-hidden>{view.icon}</span>
      <span className="max-sm:sr-only">{view.text}</span>
    </p>
  );
}
