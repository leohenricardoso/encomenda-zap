import { OrderStatus, OrderTrackingStatus } from "@/domain/order/Order";

// ─── Unified status ────────────────────────────────────────────────────────────
//
// The backend models the order lifecycle as two orthogonal FSMs:
//   • OrderStatus        — decision layer (PENDING / APPROVED / REJECTED)
//   • OrderTrackingStatus — operational layer (PENDING / PAID / DELIVERED / CANCELLED)
//
// For the UI we collapse these into a single 5-state display concept so
// store staff see one clear status label per order instead of two.
//
//   pending          = OrderStatus.PENDING
//   awaiting_payment = OrderStatus.APPROVED + tracking PENDING (or null)
//   paid             = OrderStatus.APPROVED + tracking PAID
//   delivered        = OrderStatus.APPROVED + tracking DELIVERED
//   cancelled        = OrderStatus.APPROVED + tracking CANCELLED
//   rejected         = OrderStatus.REJECTED

export type UnifiedStatus =
  | "pending"
  | "awaiting_payment"
  | "paid"
  | "delivered"
  | "cancelled"
  | "rejected";

/**
 * getUnifiedStatus — derives the single display status from the two backend fields.
 *
 * This is the single source of truth for status display logic.
 * Use it in cards, badges, and any place that needs a single status label.
 */
export function getUnifiedStatus(
  status: OrderStatus,
  orderStatus: OrderTrackingStatus | null,
): UnifiedStatus {
  if (status === OrderStatus.REJECTED) return "rejected";
  if (status === OrderStatus.PENDING) return "pending";
  // APPROVED — delegate to the tracking layer
  switch (orderStatus) {
    case OrderTrackingStatus.PAID:
      return "paid";
    case OrderTrackingStatus.DELIVERED:
      return "delivered";
    case OrderTrackingStatus.CANCELLED:
      return "cancelled";
    default:
      // OrderTrackingStatus.PENDING or null (shouldn't be null if APPROVED, but safe)
      return "awaiting_payment";
  }
}

// ─── Display config ────────────────────────────────────────────────────────────

export interface StatusMeta {
  /** Human-readable Portuguese label shown in badges and headings */
  label: string;
  /** Tailwind classes for the pill badge */
  badgeClass: string;
  /** Tailwind color class for the card's left-border accent (no border-l-4) */
  accentClass: string;
}

export const UNIFIED_STATUS_CONFIG: Record<UnifiedStatus, StatusMeta> = {
  pending: {
    label: "Pendente",
    badgeClass: "bg-amber-100 text-amber-800",
    accentClass: "border-l-amber-400",
  },
  awaiting_payment: {
    label: "Aguard. Pagamento",
    badgeClass: "bg-orange-100 text-orange-700",
    accentClass: "border-l-orange-400",
  },
  paid: {
    label: "Pago",
    badgeClass: "bg-green-100 text-green-800",
    accentClass: "border-l-green-500",
  },
  delivered: {
    label: "Entregue",
    badgeClass: "bg-blue-100 text-blue-700",
    accentClass: "border-l-blue-500",
  },
  cancelled: {
    label: "Cancelado",
    badgeClass: "bg-surface-hover text-foreground-muted",
    accentClass: "border-l-line",
  },
  rejected: {
    label: "Recusado",
    badgeClass: "bg-red-100 text-red-700",
    accentClass: "border-l-red-300",
  },
};

// Backward-compat alias used in the detail page (OrderDecisionBadge takes care
// of its own config; STATUS_CONFIG is kept for any external consumer).
export const STATUS_CONFIG = {
  [OrderStatus.PENDING]: UNIFIED_STATUS_CONFIG.pending,
  [OrderStatus.APPROVED]: UNIFIED_STATUS_CONFIG.awaiting_payment,
  [OrderStatus.REJECTED]: UNIFIED_STATUS_CONFIG.rejected,
};

// ─── StatusBadge component ────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: OrderStatus;
  /**
   * Pass the tracking status so the badge can show the full 5-state label.
   * Omit (or pass null) to fall back to the decision-only label.
   */
  orderStatus?: OrderTrackingStatus | null;
  /**
   * "sm"  → xs text, compact padding   (default – used in list cards)
   * "md"  → sm text, slightly more padding (used in detail / action bar)
   */
  size?: "sm" | "md";
  className?: string;
}

/**
 * StatusBadge — pill badge for the unified order status.
 *
 * Server Component — no interactivity. Derives the display label from both
 * the decision status and the tracking status so store staff see one clear
 * label per order (e.g. "Aguard. Pagamento", "Pago", "Entregue").
 */
export function StatusBadge({
  status,
  orderStatus = null,
  size = "sm",
  className = "",
}: StatusBadgeProps) {
  const unified = getUnifiedStatus(status, orderStatus);
  const { label, badgeClass } = UNIFIED_STATUS_CONFIG[unified];

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
