/**
 * Card — elevated surface container.
 *
 * Provides consistent padding, border, border-radius and shadow.
 * Renders a semantic <div> — wrap in <article> or <section> at call site
 * when the content warrants a more specific landmark.
 *
 * Props extend HTMLDivElement so callers can pass id, aria-*, data-*, etc.
 *
 * Usage:
 *   <Card>
 *     <p>Content here</p>
 *   </Card>
 *
 *   <Card className="sm:max-w-md">
 *     Constrained card
 *   </Card>
 */

import type { HTMLAttributes, ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={[
        // Surface
        "bg-surface",
        // Border — uses --color-line token
        "border border-line",
        // Shape
        "rounded-xl",
        // Spacing — generous padding for comfort, tight on mobile
        "p-6 sm:p-8",
        // Depth — subtle shadow that lifts card off bg-surface-subtle
        "shadow-sm",
        // Caller overrides
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
