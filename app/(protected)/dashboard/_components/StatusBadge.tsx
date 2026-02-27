import { OrderStatus } from "@/domain/order/Order";

// ─── Centralised status configuration ────────────────────────────────────────
//
// Single source of truth for status metadata used across the dashboard:
//   • OrderCard list view    (badge + left-border accent)
//   • Order detail page      (badge in StatusActions)
//
// Adding a new status requires only a new entry here — no hunting through
// multiple files for hardcoded strings.

export interface StatusMeta {
  /** Human-readable Portuguese label */
  label: string;
  /** Tailwind classes for the pill badge */
  badgeClass: string;
  /** Tailwind classes for the card's left-border accent */
  accentClass: string;
}

export const STATUS_CONFIG: Record<OrderStatus, StatusMeta> = {
  [OrderStatus.PENDING]: {
    label: "Pendente",
    badgeClass: "bg-amber-100 text-amber-800",
    accentClass: "border-l-4 border-l-amber-400",
  },
  [OrderStatus.APPROVED]: {
    label: "Aprovado",
    badgeClass: "bg-green-100 text-green-800",
    accentClass: "border-l-4 border-l-green-500",
  },
  [OrderStatus.REJECTED]: {
    label: "Recusado",
    badgeClass: "bg-surface-hover text-foreground-muted",
    accentClass: "border-l-4 border-l-line",
  },
};

// ─── StatusBadge ─────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: OrderStatus;
  /**
   * "sm"  → xs text, compact padding   (default – used in list cards)
   * "md"  → sm text, slightly more padding (used in detail / action bar)
   */
  size?: "sm" | "md";
  className?: string;
}

/**
 * Renders a rounded-full pill badge for an OrderStatus.
 *
 * @example
 * <StatusBadge status={OrderStatus.PENDING} />
 * <StatusBadge status={order.status} size="md" />
 */
export function StatusBadge({
  status,
  size = "sm",
  className = "",
}: StatusBadgeProps) {
  const { label, badgeClass } = STATUS_CONFIG[status];

  const sizeClass =
    size === "md"
      ? "rounded-full px-3 py-1 text-sm font-semibold"
      : "rounded-full px-2.5 py-0.5 text-xs font-medium";

  return (
    <span className={[sizeClass, badgeClass, className].join(" ")}>
      {label}
    </span>
  );
}
