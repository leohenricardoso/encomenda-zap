/**
 * Header — top bar of the authenticated shell.
 *
 * Responsibilities:
 *   - Show hamburger menu button on mobile (hidden on desktop where the
 *     sidebar is always visible)
 *   - Display the current store name (or SaaS brand on narrow viewports)
 *   - Provide a right-side slot for future actions (avatar, notifications…)
 *
 * The component is intentionally stateless: it receives callbacks as props.
 * State (sidebar open/closed) lives in AppShell.
 */

import type { ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HeaderProps {
  /** Opens the mobile sidebar drawer */
  onMenuClick: () => void;
  /** Store / workspace name shown in the header */
  storeName?: string;
  /** Optional right-side content (avatar, notifications, etc.) */
  actions?: ReactNode;
}

// ─── Hamburger icon ───────────────────────────────────────────────────────────

function MenuIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
      />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Header({
  onMenuClick,
  storeName = "Encomenda Zap",
  actions,
}: HeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-line bg-surface px-4 md:px-6">
      {/* ── Hamburger — only rendered (and visible) on mobile ──────────────── */}
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Abrir menu de navegação"
        className={[
          "lg:hidden",
          "-m-2 flex h-9 w-9 items-center justify-center rounded-md",
          "text-foreground-muted transition-colors",
          "hover:bg-surface-hover hover:text-foreground",
          "ring-focus",
        ].join(" ")}
      >
        <MenuIcon />
      </button>

      {/* ── Store name ─────────────────────────────────────────────────────── */}
      <p className="text-sm font-semibold text-foreground truncate">
        {storeName}
      </p>

      {/* ── Right slot ─────────────────────────────────────────────────────── */}
      {actions && (
        <div className="ml-auto flex items-center gap-2">{actions}</div>
      )}
    </header>
  );
}
