/**
 * NavItem — single navigation link inside the Sidebar.
 *
 * Intentionally pure UI:
 *   - No router logic here; isActive is passed from parent.
 *   - onClick forwarded so Sidebar can close the mobile drawer on navigation.
 *
 * Follows the Linear/Stripe sidebar item pattern:
 *   Active  → subtle bg highlight + full-opacity text
 *   Default → muted text, soft bg on hover
 */

import Link from "next/link";
import type { ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NavItemProps {
  /** Display label shown beside the icon */
  label: string;
  /** Destination route */
  href: string;
  /** Heroicon-compatible SVG node (24px viewBox, stroke-based) */
  icon: ReactNode;
  /** Drives the active highlight; computed by parent via usePathname() */
  isActive?: boolean;
  /** Called after the link click — used to close the mobile sidebar */
  onClick?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NavItem({
  label,
  href,
  icon,
  isActive = false,
  onClick,
}: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={[
        // Base layout
        "group relative flex items-center gap-3 rounded-lg px-3 py-2",
        "text-sm font-medium transition-all duration-150",
        "ring-focus",
        // State-driven colours
        isActive
          ? "bg-accent/8 text-foreground"
          : "text-foreground-muted hover:bg-surface-hover hover:text-foreground",
      ].join(" ")}
    >
      {/* Active indicator — left accent bar */}
      {isActive && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-accent"
        />
      )}

      {/* Icon wrapper */}
      <span
        className={[
          "h-5 w-5 shrink-0 transition-colors duration-150",
          isActive
            ? "text-accent"
            : "text-foreground-muted group-hover:text-foreground",
        ].join(" ")}
        aria-hidden="true"
      >
        {icon}
      </span>

      {label}
    </Link>
  );
}
