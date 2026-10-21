"use client";

import { useEffect, useEffectEvent, useState } from "react";

/**
 * Counts down from `initialSeconds` (as computed by the server) against the
 * local clock. Returns null when there is no time limit. Calls `onExpire` once.
 */
export function useCountdown(initialSeconds: number | null, onExpire: () => void) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const expire = useEffectEvent(onExpire);

  useEffect(() => {
    if (initialSeconds === null) return;
    const deadline = Date.now() + initialSeconds * 1000;
    let expired = false;

    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0 && !expired) {
        expired = true;
        clearInterval(interval);
        expire();
      }
    };
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [initialSeconds]);

  return remaining;
}
