import type { ButtonHTMLAttributes } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-molten text-on-molten font-semibold shadow-card hover:shadow-lift hover:brightness-[1.04] active:brightness-95",
  secondary: "border border-border bg-surface text-fg hover:border-border-strong hover:bg-surface-2",
  ghost: "text-fg-muted hover:bg-surface-2 hover:text-fg",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-9 gap-1.5 rounded-full px-3.5 text-sm",
  md: "h-11 gap-2 rounded-full px-5 text-[0.9375rem]",
  lg: "h-13 gap-2.5 rounded-full px-7 text-base",
  icon: "size-11 rounded-full",
};

/** Class string for button-styled links and other elements. */
export function buttonClass({
  variant = "primary",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(
    "font-display inline-flex shrink-0 items-center justify-center whitespace-nowrap select-none",
    "transition-[background-color,border-color,color,box-shadow,filter,transform] duration-200 ease-out-quint",
    "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-55",
    variantClass[variant],
    sizeClass[size],
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  variant,
  size,
  loading = false,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass({ variant, size, className })}
      {...props}
    >
      {loading && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
      {children}
    </button>
  );
}
