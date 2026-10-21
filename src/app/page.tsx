import { CheckSquare, CircleDot, ToggleLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

// Placeholder for Tahap 0: shows the design tokens in both themes.
// Replaced by the real landing (name form + presets) in Tahap 3.

const questionTypes = [
  { icon: CircleDot, label: "Pilihan Tunggal", count: 108, hint: "Pilih satu jawaban" },
  { icon: CheckSquare, label: "Multi Jawaban", count: 75, hint: "Pilih semua yang benar" },
  { icon: ToggleLeft, label: "Benar / Salah", count: 67, hint: "Tentukan pernyataan" },
];

const swatches = [
  { name: "bg", className: "bg-bg" },
  { name: "surface", className: "bg-surface" },
  { name: "surface-2", className: "bg-surface-2" },
  { name: "molten", className: "bg-molten" },
  { name: "success", className: "bg-success" },
  { name: "danger", className: "bg-danger" },
  { name: "info", className: "bg-info" },
];

export default function Home() {
  return (
    <>
      <div aria-hidden className="bg-molten fixed inset-x-0 top-0 z-50 h-0.5" />

      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="bg-molten text-on-molten font-display grid size-9 place-items-center rounded-xl text-sm font-bold shadow-card">
            wQ
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">weQuiz</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col gap-14 px-5 pt-10 pb-20 sm:px-8 sm:pt-16">
        <section className="flex flex-col gap-6">
          <p className="text-accent font-display text-sm font-medium tracking-[0.18em] uppercase">
            Casting · Divisi Molding
          </p>
          <h1 className="font-display max-w-3xl text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl">
            Ujian kompetensi yang <span className="text-molten">tajam</span>, cepat, dan jelas.
          </h1>
          <p className="text-fg-muted max-w-xl text-lg leading-relaxed">
            Pemindahan jabatan &amp; peningkatan skill. Isi nama, kerjakan soal, dan lihat nilai Anda langsung.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              disabled
              className="bg-molten text-on-molten font-display inline-flex h-12 items-center rounded-full px-6 font-semibold shadow-lift disabled:cursor-not-allowed disabled:opacity-80"
            >
              Mulai Ujian
            </button>
            <span className="text-fg-subtle text-sm">Segera hadir di Tahap 3</span>
          </div>
        </section>

        <section aria-labelledby="types-heading" className="flex flex-col gap-5">
          <h2 id="types-heading" className="font-display text-fg-muted text-sm font-medium tracking-wide uppercase">
            Bank soal · 250 soal
          </h2>
          <ul className="grid gap-4 sm:grid-cols-3">
            {questionTypes.map(({ icon: Icon, label, count, hint }) => (
              <li
                key={label}
                className="group border-border bg-surface rounded-card border p-5 shadow-card transition-[transform,box-shadow,border-color] duration-300 ease-out-quint hover:-translate-y-1 hover:border-border-strong hover:shadow-lift"
              >
                <div className="flex items-start justify-between">
                  <span className="bg-accent-soft text-accent grid size-10 place-items-center rounded-xl">
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <span className="font-display text-3xl font-semibold tabular-nums">{count}</span>
                </div>
                <p className="font-display mt-6 text-lg font-semibold">{label}</p>
                <p className="text-fg-muted text-sm">{hint}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="tokens-heading" className="flex flex-col gap-5">
          <h2 id="tokens-heading" className="font-display text-fg-muted text-sm font-medium tracking-wide uppercase">
            Design tokens
          </h2>
          <ul className="flex flex-wrap gap-3">
            {swatches.map((s) => (
              <li key={s.name} className="flex flex-col items-center gap-2">
                <span className={`${s.className} border-border size-14 rounded-2xl border`} />
                <code className="text-fg-subtle text-xs">{s.name}</code>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2 text-sm font-medium">
            <span className="bg-success-soft text-success rounded-full px-3 py-1">✓ Benar</span>
            <span className="bg-danger-soft text-danger rounded-full px-3 py-1">✗ Salah</span>
            <span className="bg-info-soft text-info rounded-full px-3 py-1">? Ragu-ragu</span>
          </div>
        </section>
      </main>
    </>
  );
}
