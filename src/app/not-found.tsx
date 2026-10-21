import Link from "next/link";
import { Home } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-5 py-20 text-center">
      <p className="font-display text-molten text-7xl font-semibold">404</p>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-semibold">Halaman tidak ditemukan</h1>
        <p className="text-fg-muted">Tautan ujian ini tidak valid atau sudah tidak tersedia.</p>
      </div>
      <Link href="/" className={buttonClass()}>
        <Home aria-hidden className="size-4" /> Ke halaman utama
      </Link>
    </main>
  );
}
