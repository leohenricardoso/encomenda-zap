/**
 * PageHeader — consistent page-level header used across all dashboard pages.
 *
 * Renders:
 *   • section-label (tracked uppercase category label)  [optional]
 *   • h1 title
 *   • description text                                  [optional]
 *   • primary action slot (button/link)                 [optional]
 *
 * Professional.md: "Each page must include: page title, short description,
 * primary action button". Thin rule line below creates visual rhythm.
 *
 * Server Component — no interactivity.
 */

import type { ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageHeaderProps {
  /** Short tracked-uppercase label above the title (e.g. "Gestão") */
  eyebrow?: string;
  /** Main page title */
  title: string;
  /** One-line description shown below the title */
  description?: string;
  /** Right-side slot — primary action button or group of buttons */
  actions?: ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="border-b border-line bg-surface px-6 py-5 md:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {/* ── Title group ─────────────────────────────────────────────────── */}
        <div className="min-w-0">
          {eyebrow && (
            <p className="section-label mb-1.5 text-accent">{eyebrow}</p>
          )}
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-foreground-muted">{description}</p>
          )}
        </div>

        {/* ── Action slot ─────────────────────────────────────────────────── */}
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}
