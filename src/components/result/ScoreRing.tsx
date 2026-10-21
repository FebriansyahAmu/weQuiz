"use client";

import { useEffect, useId } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { cn } from "@/lib/cn";
import { formatScore } from "@/lib/format";

const RADIUS = 52;
const STROKE = 10;
const VIEWBOX = (RADIUS + STROKE) * 2;

/** Circular score gauge. The arc and the number count up from 0 to the score. */
export function ScoreRing({ score, className }: { score: number; className?: string }) {
  const gradientId = useId();
  const reduceMotion = useReducedMotion();
  const value = useMotionValue(0);

  useEffect(() => {
    if (reduceMotion) {
      value.set(score);
      return;
    }
    const controls = animate(value, score, { duration: 1.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [reduceMotion, score, value]);

  const pathLength = useTransform(value, (v) => v / 100);
  const arcOpacity = useTransform(value, (v) => (v > 0 ? 1 : 0));
  // Whole numbers while counting, the exact score (with decimals) once settled.
  const label = useTransform(value, (v) => (v >= score ? formatScore(score) : String(Math.floor(v))));

  return (
    <div className={cn("relative aspect-square", className)}>
      <svg viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} aria-hidden className="size-full -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--molten-from)" }} />
            <stop offset="100%" style={{ stopColor: "var(--molten-to)" }} />
          </linearGradient>
        </defs>
        <circle
          cx={VIEWBOX / 2}
          cy={VIEWBOX / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-surface-2"
        />
        <motion.circle
          cx={VIEWBOX / 2}
          cy={VIEWBOX / 2}
          r={RADIUS}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={STROKE}
          strokeLinecap="round"
          style={{ pathLength, opacity: arcOpacity }}
          className="drop-shadow-[0_0_6px_color-mix(in_oklab,var(--molten-to)_45%,transparent)]"
        />
      </svg>

      <div className="absolute inset-0 grid place-items-center">
        <p className="flex flex-col items-center leading-none">
          <span className="sr-only">Skor {formatScore(score)} persen</span>
          <span aria-hidden className="font-display flex items-start font-semibold tracking-tight tabular-nums">
            <motion.span className="text-[clamp(2.75rem,12vw,4rem)]">{label}</motion.span>
            <span className="text-fg-muted mt-1.5 text-xl">%</span>
          </span>
          <span aria-hidden className="text-fg-subtle mt-2 text-xs font-medium tracking-[0.2em] uppercase">
            Skor
          </span>
        </p>
      </div>
    </div>
  );
}
