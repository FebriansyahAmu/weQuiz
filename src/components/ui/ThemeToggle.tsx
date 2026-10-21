"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";
import { THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function getTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  // null on the server: the real theme is only known after the init script runs.
  const theme = useSyncExternalStore<Theme | null>(subscribe, getTheme, () => null);
  const isDark = theme === "dark";

  function toggle() {
    const next: Theme = isDark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode); the theme still applies for this visit.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === null ? "Ganti tema" : isDark ? "Ganti ke tema terang" : "Ganti ke tema gelap"}
      className={cn(
        "relative inline-flex size-11 items-center justify-center rounded-full border border-border bg-surface text-fg-muted",
        "transition-[color,border-color,transform] duration-200 hover:border-border-strong hover:text-fg active:scale-95",
        className,
      )}
    >
      {/* Icons follow the [data-theme] attribute via CSS so they're right before hydration. */}
      <Sun
        aria-hidden
        className="size-5 scale-100 rotate-0 opacity-100 transition-all duration-300 dark:scale-0 dark:rotate-90 dark:opacity-0"
      />
      <Moon
        aria-hidden
        className="absolute size-5 scale-0 -rotate-90 opacity-0 transition-all duration-300 dark:scale-100 dark:rotate-0 dark:opacity-100"
      />
    </button>
  );
}
