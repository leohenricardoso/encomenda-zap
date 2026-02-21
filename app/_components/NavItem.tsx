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
        // Base — shared across all states
        "group flex items-center gap-3 rounded-lg px-3 py-2",
        "text-sm font-medium transition-colors duration-100",
        "ring-focus",
        // State-driven colours
        isActive
          ? "bg-surface-hover text-foreground"
          : "text-foreground-muted hover:bg-surface-hover hover:text-foreground",
      ].join(" ")}
    >
      {/* Icon wrapper — shrink prevents icon squishing on long labels */}
      <span
        className={[
          "h-5 w-5 shrink-0 transition-colors duration-100",
          isActive
            ? "text-foreground"
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
