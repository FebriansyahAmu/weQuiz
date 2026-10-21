/**
 * Score bands for the result page. These are descriptive labels only: there is
 * no pass mark (KKM) yet, see PRD §12, so nothing here says "lulus"/"tidak lulus".
 */
export type ScoreTone = "success" | "accent" | "info" | "danger";

export interface ScoreBand {
  /** Inclusive lower bound, 0–100. */
  min: number;
  label: string;
  message: string;
  tone: ScoreTone;
}

/** Ordered from the highest band down. */
export const SCORE_BANDS: readonly ScoreBand[] = [
  { min: 90, label: "Istimewa", message: "Penguasaan materi sangat baik. Pertahankan!", tone: "success" },
  { min: 75, label: "Baik", message: "Sebagian besar materi sudah dikuasai.", tone: "accent" },
  { min: 60, label: "Cukup", message: "Pelajari lagi soal yang salah untuk memperkuat pemahaman.", tone: "info" },
  { min: 0, label: "Perlu belajar lagi", message: "Tinjau pembahasan dengan teliti, lalu coba lagi.", tone: "danger" },
];

export function getScoreBand(score: number): ScoreBand {
  return SCORE_BANDS.find((band) => score >= band.min) ?? SCORE_BANDS[SCORE_BANDS.length - 1];
}
