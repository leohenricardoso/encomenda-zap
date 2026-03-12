"use client";

/**
 * CollapsibleSettingsGroup — animated expand/collapse wrapper for settings sections.
 *
 * Replaces SettingsCard as the outer shell for each settings group.
 * The header is always visible; the form content animates in/out using the
 * CSS grid-template-rows trick (no JS height measurement needed).
 *
 * Collapsed by default — store owners open only what they need to edit.
 *
 * UX patterns (Stripe / Linear):
 *   • Subtle hover state on header
 *   • Chevron rotates 180° when expanded
 *   • Smooth 200ms ease transition
 *   • aria-expanded for accessibility
 */

import { useState } from "react";

interface CollapsibleSettingsGroupProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  /** Open by default? Defaults to false. */
  defaultOpen?: boolean;
}

export function CollapsibleSettingsGroup({
  title,
  description,
  icon,
  children,
  defaultOpen = false,
}: CollapsibleSettingsGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-line bg-surface overflow-hidden">
      {/* ── Clickable header ───────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center gap-4 px-6 py-5 text-left hover:bg-surface-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
        aria-expanded={isOpen}
      >
        {/* Icon badge */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-foreground-muted">
          {icon}
        </div>

        {/* Title + description */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 text-xs text-foreground-muted leading-relaxed truncate">
            {description}
          </p>
        </div>

        {/* Chevron */}
        <ChevronDownIcon
          className={[
            "h-4 w-4 shrink-0 text-foreground-muted transition-transform duration-200",
            isOpen ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {/* ── Animated content ───────────────────────────────────────────── */}
      <div
        className={[
          "grid transition-[grid-template-rows] duration-200",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        ].join(" ")}
      >
        <div className="overflow-hidden">
          <div className="border-t border-line px-6 pb-6 pt-5 space-y-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Icon ─────────────────────────────────────────────────────────────────────

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
