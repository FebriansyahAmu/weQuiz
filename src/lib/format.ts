/** Display formatting shared by server and client components (locale: id-ID). */

const scoreFormatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

/** 66.67 → "66,67", 80 → "80". */
export function formatScore(score: number): string {
  return scoreFormatter.format(score);
}

/** 3725 → "1 j 2 mnt", 754 → "12 mnt 34 dtk", 42 → "42 dtk". */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return m > 0 ? `${h} j ${m} mnt` : `${h} j`;
  if (m > 0) return s > 0 ? `${m} mnt ${s} dtk` : `${m} mnt`;
  return `${s} dtk`;
}

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Formats in the runtime's time zone, so call it on the client for the viewer's local time. */
export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}
