"use client";

import { AlertTriangle, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";

interface SubmitDialogProps {
  open: boolean;
  onClose: () => void;
  total: number;
  answered: number;
  unansweredIndexes: number[];
  flaggedIndexes: number[];
  onJump: (index: number) => void;
  onConfirm: () => void;
  submitting: boolean;
  error: string | null;
}

function IndexChips({ indexes, onJump, tone }: { indexes: number[]; onJump: (i: number) => void; tone: string }) {
  return (
    <ul className="-m-1 flex max-h-36 flex-wrap gap-1.5 overflow-y-auto p-1">
      {indexes.map((index) => (
        <li key={index}>
          <button
            type="button"
            onClick={() => onJump(index)}
            className={`font-display h-8 min-w-8 rounded-lg border px-2 text-sm tabular-nums transition-colors ${tone}`}
          >
            {index + 1}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function SubmitDialog({
  open,
  onClose,
  total,
  answered,
  unansweredIndexes,
  flaggedIndexes,
  onJump,
  onConfirm,
  submitting,
  error,
}: SubmitDialogProps) {
  const unanswered = unansweredIndexes.length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      dismissible={!submitting}
      variant="sheet"
      title="Kumpulkan ujian?"
      description="Setelah dikumpulkan, jawaban tidak dapat diubah lagi."
    >
      <dl className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Terjawab", value: answered, tone: "text-fg" },
          { label: "Kosong", value: unanswered, tone: unanswered ? "text-danger" : "text-fg" },
          { label: "Ragu-ragu", value: flaggedIndexes.length, tone: flaggedIndexes.length ? "text-info" : "text-fg" },
        ].map((stat) => (
          <div key={stat.label} className="bg-surface-2 rounded-2xl px-2 py-3">
            <dt className="text-fg-muted text-xs">{stat.label}</dt>
            <dd className={`font-display mt-0.5 text-2xl font-semibold tabular-nums ${stat.tone}`}>{stat.value}</dd>
          </div>
        ))}
      </dl>

      {unanswered > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm">
            <span className="font-semibold">{unanswered} soal belum dijawab</span>
            <span className="text-fg-muted"> dan akan dihitung salah. Ketuk nomor untuk membuka soalnya.</span>
          </p>
          <IndexChips indexes={unansweredIndexes} onJump={onJump} tone="border-danger/40 text-danger hover:bg-danger-soft" />
        </div>
      )}

      {flaggedIndexes.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-fg-muted text-sm">Ditandai ragu-ragu:</p>
          <IndexChips indexes={flaggedIndexes} onJump={onJump} tone="border-info/40 text-info hover:bg-info-soft" />
        </div>
      )}

      {error && (
        <p role="alert" className="bg-danger-soft text-danger flex items-start gap-2 rounded-xl p-3 text-sm">
          <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose} disabled={submitting}>
          Periksa lagi
        </Button>
        <Button onClick={onConfirm} loading={submitting}>
          {!submitting && <Send aria-hidden className="size-4" />}
          {submitting ? "Mengumpulkan…" : `Kumpulkan ${answered}/${total}`}
        </Button>
      </div>
    </Dialog>
  );
}
