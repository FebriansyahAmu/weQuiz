"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { api, ApiError } from "@/lib/api-client";
import { AutosaveQueue } from "@/lib/autosave-queue";

const FATAL_CODES = new Set(["ATTEMPT_LOCKED", "TIME_EXPIRED", "ATTEMPT_NOT_FOUND"]);

function describeError(error: unknown) {
  if (error instanceof ApiError && error.code === "NETWORK_ERROR") {
    return "Koneksi terputus. Jawaban akan disimpan saat online.";
  }
  return error instanceof Error ? error.message : "Gagal menyimpan jawaban.";
}

/**
 * Binds an AutosaveQueue to an attempt. `onFatal` runs when the server says the
 * attempt can no longer be changed (submitted, expired or gone).
 */
export function useAutosave(attemptId: string, onFatal: (error: ApiError) => void) {
  const [queue] = useState(
    () =>
      new AutosaveQueue((questionId, payload) => api.saveAnswer(attemptId, { questionId, ...payload }), {
        isFatal: (error) => error instanceof ApiError && FATAL_CODES.has(error.code),
        isRetryable: (error) => !(error instanceof ApiError) || error.retryable,
        describeError,
      }),
  );

  const snapshot = useSyncExternalStore(queue.subscribe, queue.getSnapshot, queue.getSnapshot);

  useEffect(() => {
    queue.setFatalHandler((error) => onFatal(error as ApiError));
    return () => queue.setFatalHandler(undefined);
  }, [queue, onFatal]);

  useEffect(() => {
    const onOnline = () => queue.retryNow();
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (queue.getSnapshot().unsaved > 0) event.preventDefault();
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("beforeunload", onBeforeUnload);
    queue.retryNow();
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("beforeunload", onBeforeUnload);
      // Leaving the page: push anything pending right away (requests use keepalive).
      queue.pause();
      void queue.flush();
    };
  }, [queue]);

  return { queue, snapshot };
}
