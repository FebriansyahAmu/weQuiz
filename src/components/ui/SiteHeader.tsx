import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "./ThemeToggle";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "bg-molten text-on-molten font-display shadow-card grid size-9 shrink-0 place-items-center rounded-xl text-sm font-bold",
        className,
      )}
    >
      wQ
    </span>
  );
}

/** Top bar for non-exam pages: brand (links home), optional actions, theme toggle. */
export function SiteHeader({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <header
      className={cn("relative z-10 mx-auto flex w-full max-w-6xl items-center gap-3 px-5 py-5 sm:px-8", className)}
    >
      <Link href="/" className="flex items-center gap-3 rounded-xl" aria-label="weQuiz, ke halaman utama">
        <BrandMark />
        <span className="font-display text-lg font-semibold tracking-tight">weQuiz</span>
      </Link>
      <div className="ml-auto flex items-center gap-2">
        {children}
        <ThemeToggle />
      </div>
    </header>
  );
}
