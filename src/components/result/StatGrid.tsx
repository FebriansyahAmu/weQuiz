import Link from "next/link";
import { ArrowUpRight, CheckCircle2, CircleDashed, Clock, XCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/lib/format";
import type { ReviewFilter } from "@/lib/review-filter";
import type { AttemptResultDTO } from "@/types/dto";

interface Stat {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone: string;
  /** Opens the review on this subset when there is something to look at. */
  filter?: ReviewFilter;
}

const cardClass = "bg-surface border-border flex h-full flex-col gap-3 rounded-2xl border p-4 sm:p-5";

export function StatGrid({ result }: { result: AttemptResultDTO }) {
  const stats: Stat[] = [
    { label: "Benar", value: result.correct, icon: CheckCircle2, tone: "text-success", filter: "correct" },
    { label: "Salah", value: result.wrong, icon: XCircle, tone: "text-danger", filter: "wrong" },
    { label: "Kosong", value: result.unanswered, icon: CircleDashed, tone: "text-fg-muted", filter: "empty" },
    { label: "Durasi", value: formatDuration(result.durationSeconds), icon: Clock, tone: "text-info" },
  ];

  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, tone, filter }) => {
        const linkable = filter !== undefined && value !== 0;
        const body = (
          <>
            <span className="text-fg-muted flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2">
                <Icon aria-hidden className={cn("size-4", tone)} />
                {label}
              </span>
              {linkable && (
                <ArrowUpRight
                  aria-hidden
                  className="text-fg-subtle size-4 transition-[color,translate] duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-fg"
                />
              )}
            </span>
            <span className="font-display text-2xl font-semibold tabular-nums sm:text-3xl">{value}</span>
          </>
        );
        return (
          <li key={label}>
            {linkable ? (
              <Link
                href={`/result/${result.id}/review?filter=${filter}`}
                aria-label={`${label}: ${value} soal. Lihat pembahasannya`}
                className={cn(
                  cardClass,
                  "group hover:border-border-strong hover:shadow-card transition-[border-color,box-shadow,transform] duration-200 active:scale-[0.98]",
                )}
              >
                {body}
              </Link>
            ) : (
              <div className={cardClass}>{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
