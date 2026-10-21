import { CheckSquare, CircleDot, Save, ShieldCheck, ToggleLeft } from "lucide-react";
import { ResumeBanner } from "@/components/landing/ResumeBanner";
import { StartExamForm } from "@/components/landing/StartExamForm";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const questionTypes = [
  { icon: CircleDot, label: "Pilihan Tunggal", hint: "Satu jawaban paling tepat" },
  { icon: CheckSquare, label: "Multi Jawaban", hint: "Semua jawaban yang benar" },
  { icon: ToggleLeft, label: "Benar / Salah", hint: "Nilai pernyataan" },
];

const notes = [
  { icon: Save, text: "Jawaban tersimpan otomatis. Ujian bisa dilanjutkan jika halaman tertutup." },
  { icon: ShieldCheck, text: "Nilai = jumlah jawaban benar ÷ jumlah soal × 100. Soal kosong dihitung salah." },
];

export default function Home() {
  return (
    <>
      <div aria-hidden className="bg-molten fixed inset-x-0 top-0 z-50 h-0.5" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="bg-molten text-on-molten font-display shadow-card grid size-9 place-items-center rounded-xl text-sm font-bold">
            wQ
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">weQuiz</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-start gap-10 px-5 pt-6 pb-16 sm:px-8 lg:grid-cols-[1fr_minmax(0,30rem)] lg:gap-16 lg:pt-14">
        <section className="flex flex-col gap-8 lg:sticky lg:top-14">
          <div className="flex flex-col gap-5">
            <p className="text-accent font-display text-sm font-medium tracking-[0.18em] uppercase">
              Casting · Divisi Molding
            </p>
            <h1 className="font-display text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Ujian kompetensi yang <span className="text-molten">tajam</span>, cepat, dan jelas.
            </h1>
            <p className="text-fg-muted max-w-xl text-lg leading-relaxed">
              Pemindahan jabatan &amp; peningkatan skill. Isi nama, pilih paket, lalu kerjakan soal. Nilai langsung
              tampil setelah ujian dikumpulkan.
            </p>
          </div>

          <ul className="grid gap-3 sm:grid-cols-3">
            {questionTypes.map(({ icon: Icon, label, hint }) => (
              <li key={label} className="border-border bg-surface/70 flex items-center gap-3 rounded-2xl border p-3.5">
                <span className="bg-accent-soft text-accent grid size-9 shrink-0 place-items-center rounded-xl">
                  <Icon aria-hidden className="size-[1.125rem]" />
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="font-display text-sm font-semibold">{label}</span>
                  <span className="text-fg-muted text-xs">{hint}</span>
                </span>
              </li>
            ))}
          </ul>

          <ul className="text-fg-muted hidden flex-col gap-2.5 text-sm lg:flex">
            {notes.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-2.5">
                <Icon aria-hidden className="text-fg-subtle mt-0.5 size-4 shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="start-heading" className="flex flex-col gap-4">
          <ResumeBanner />
          <div className="bg-surface border-border rounded-card shadow-lift flex flex-col gap-6 border p-5 sm:p-7">
            <div className="flex flex-col gap-1">
              <h2 id="start-heading" className="font-display text-xl font-semibold">
                Mulai ujian
              </h2>
              <p className="text-fg-muted text-sm">Tidak perlu akun. Cukup tulis nama Anda.</p>
            </div>
            <StartExamForm />
          </div>
          <ul className="text-fg-muted flex flex-col gap-2.5 text-sm lg:hidden">
            {notes.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-2.5">
                <Icon aria-hidden className="text-fg-subtle mt-0.5 size-4 shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
