"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-5 py-20 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-semibold">Terjadi kesalahan</h1>
        <p className="text-fg-muted">
          Halaman gagal dimuat. Jawaban yang sudah tersimpan tetap aman. Silakan coba lagi.
        </p>
      </div>
      <Button onClick={() => retry()}>
        <RotateCcw aria-hidden className="size-4" /> Coba lagi
      </Button>
    </main>
  );
}
