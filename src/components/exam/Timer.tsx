import { Clock } from "lucide-react";
import { cn } from "@/lib/cn";

function format(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function Timer({ seconds }: { seconds: number }) {
  const warning = seconds <= 5 * 60;
  const critical = seconds <= 60;
  const minutesLeft = Math.ceil(seconds / 60);

  return (
    <div
      role="timer"
      aria-label={`Sisa waktu ${minutesLeft} menit`}
      className={cn(
        "font-display inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold tabular-nums transition-colors",
        critical
          ? "border-danger bg-danger-soft text-danger animate-pulse"
          : warning
            ? "border-accent bg-accent-soft text-accent"
            : "border-border bg-surface text-fg",
      )}
    >
      <Clock aria-hidden className="size-4" />
      {format(seconds)}
    </div>
  );
}
