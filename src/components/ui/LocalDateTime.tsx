"use client";

import { useSyncExternalStore } from "react";
import { formatDateTime } from "@/lib/format";

const noopSubscribe = () => () => {};

/**
 * Renders a timestamp in the viewer's time zone. The server doesn't know it, so
 * the text only appears after hydration (a placeholder keeps the layout stable).
 */
export function LocalDateTime({ iso, className }: { iso: string; className?: string }) {
  const isClient = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  return (
    <time dateTime={iso} className={className}>
      {isClient ? formatDateTime(iso) : " "}
    </time>
  );
}
