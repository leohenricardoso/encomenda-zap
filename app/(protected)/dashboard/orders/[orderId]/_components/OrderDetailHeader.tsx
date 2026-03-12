import Link from "next/link";
import { FulfillmentType, OrderTrackingStatus } from "@/domain/order/Order";
import type { OrderStatus } from "@/domain/order/Order";
import { OrderDecisionBadge } from "./OrderDecisionBadge";
import { FulfillmentBadge } from "./FulfillmentBadge";
import { formatCurrency, formatLongDate } from "./helpers";

// ─── Component ────────────────────────────────────────────────────────────────

interface OrderDetailHeaderProps {
  orderNumber: number | null;
  customerName: string;
  deliveryDate: Date;
  fulfillmentType: FulfillmentType;
  totalAmount: number;
  status: OrderStatus;
  trackingStatus: OrderTrackingStatus | null;
}

/**
 * OrderDetailHeader — sticky page header for the order detail page.
 *
 * Shows back navigation, order number, customer name, delivery date,
 * fulfillment badge and total amount at a glance.
 * The decision badge is shown on mobile; total amount on sm+.
 */
export function OrderDetailHeader({
  orderNumber,
  customerName,
  deliveryDate,
  fulfillmentType,
  totalAmount,
  status,
  trackingStatus,
}: OrderDetailHeaderProps) {
  return (
    <div className="sticky top-0 z-10 border-b border-line bg-surface/95 backdrop-blur-sm px-4 py-3">
      <div className="mx-auto max-w-6xl flex items-center gap-3">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors shrink-0"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Pedidos</span>
        </Link>

        {/* Divider */}
        <span className="hidden sm:block h-4 w-px bg-line" aria-hidden="true" />

        {/* Order identity */}
        <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {orderNumber != null && (
            <span className="shrink-0 rounded-md bg-foreground px-1.5 py-0.5 text-xs font-bold tabular-nums text-surface">
              #{orderNumber}
            </span>
          )}
          <p className="font-semibold text-foreground truncate leading-snug">
            {customerName}
          </p>
          <span className="hidden sm:inline">
            <FulfillmentBadge fulfillmentType={fulfillmentType} size="sm" />
          </span>
          <p className="hidden sm:block text-xs text-foreground-muted capitalize leading-snug">
            {formatLongDate(deliveryDate)}
          </p>
        </div>

        {/* Right side — decision badge on mobile, total on desktop */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:inline text-sm font-bold text-foreground tabular-nums">
            {formatCurrency(totalAmount)}
          </span>
          <span className="sm:hidden">
            <OrderDecisionBadge status={status} size="sm" />
          </span>
        </div>
      </div>

      {/* Mobile: date + fulfillment on a second row */}
      <div className="sm:hidden mx-auto max-w-6xl mt-1 flex items-center gap-2 pl-[calc(1rem+1rem+0.375rem)]">
        <p className="text-xs text-foreground-muted capitalize truncate">
          {formatLongDate(deliveryDate)}
        </p>
        <FulfillmentBadge fulfillmentType={fulfillmentType} size="sm" />
      </div>
    </div>
  );
}

// ─── Icon ─────────────────────────────────────────────────────────────────────

function ArrowLeftIcon({ className }: { className?: string }) {
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
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}
