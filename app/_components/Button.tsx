/**
 * Button — base interactive element used across the entire app.
 *
 * Variants:
 *   primary   — Dark fill (slate-900). Main CTA. Vercel/Linear style.
 *   secondary — Bordered, white background. Destructive-safe.
 *   ghost     — No background. For low-emphasis actions.
 *
 * Sizes:
 *   sm  — Compact (32px height). Inline actions, table rows.
 *   md  — Default (40px height). Forms, cards.
 *   lg  — Prominent (48px height). Hero CTAs.
 *
 * Accessibility:
 *   - Renders a native <button> — never a <div>.
 *   - Passes aria-disabled so assistive tech mirrors visual state.
 *   - Focus ring via ring-focus utility defined in globals.css.
 *   - Spinner icon is aria-hidden; text remains visible to screen readers.
 */

import type { ButtonHTMLAttributes, ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Shows an animated spinner and disables the button */
  loading?: boolean;
  children: ReactNode;
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const variantClasses: Record<Variant, string> = {
  // Dark fill — high contrast, Stripe/Vercel primary action style
  primary: [
    "bg-foreground text-surface",
    "hover:bg-foreground/90",
    "active:bg-foreground/80",
  ].join(" "),

  // Bordered — secondary actions that shouldn't compete with primary
  secondary: [
    "bg-surface text-foreground",
    "border border-line-strong",
    "hover:bg-surface-hover",
    "active:bg-surface-hover",
  ].join(" "),

  // No chrome — tertiary / destructive-safe
  ghost: [
    "text-foreground-muted",
    "hover:text-foreground hover:bg-surface-hover",
    "active:bg-surface-hover",
  ].join(" "),
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-5 text-base gap-2",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      aria-disabled={isDisabled}
      className={[
        // Layout
        "inline-flex items-center justify-center",
        "rounded-md font-medium",
        // Transitions
        "transition-colors duration-150",
        // Focus ring — defined in globals.css @layer utilities
        "ring-focus",
        // Disabled pointer-events
        "disabled:pointer-events-none disabled:opacity-50",
        // Variant + size
        variantClasses[variant],
        sizeClasses[size],
        // Caller overrides
        className,
      ].join(" ")}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
    >
      {/* Track */}
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      {/* Head */}
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
