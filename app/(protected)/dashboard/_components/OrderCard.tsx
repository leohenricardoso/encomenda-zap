import Link from "next/link";
import type { OrderViewModel } from "./types";
import {
  OrderStatus,
  OrderTrackingStatus,
  FulfillmentType,
} from "@/domain/order/Order";
import {
  StatusBadge,
  getUnifiedStatus,
  UNIFIED_STATUS_CONFIG,
} from "./StatusBadge";
import { OrderCardQuickActions } from "./OrderCardQuickActions";

const FULFILLMENT_LABELS: Record<FulfillmentType, string> = {
  [FulfillmentType.PICKUP]: "Retirada",
  [FulfillmentType.DELIVERY]: "Entrega",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

interface OrderCardProps {
  order: OrderViewModel;
}

/**
 * OrderCard  SaaS-style clickable card for a single order.
 *
 * Full-card navigation via CSS stretched-link pattern:
 *   The customer-name <Link> has ::after { position:absolute; inset:0 }
 *   so every click on the card body triggers navigation.
 *   The quick-actions footer uses z-10 to sit above the overlay.
 *
 * Server Component  OrderCardQuickActions is the client island.
 */
export function OrderCard({ order }: OrderCardProps) {
  const unified = getUnifiedStatus(order.status, order.orderStatus);
  // Terminal states: dim the card and hide the actions footer
  const isTerminal =
    order.status === OrderStatus.REJECTED ||
    order.orderStatus === OrderTrackingStatus.CANCELLED;

  const accentBorder = UNIFIED_STATUS_CONFIG[unified].accentClass;

  return (
    <article
      className={[
        "relative overflow-hidden rounded-xl border border-line bg-surface",
        "transition-shadow hover:shadow-sm",
        isTerminal ? "opacity-60" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/*  Main card body  */}
      <div
        className={["flex flex-col gap-3 p-4 border-l-4", accentBorder].join(
          " ",
        )}
      >
        <Link
          href={`/dashboard/orders/${order.id}`}
          className={[
            "font-semibold text-foreground leading-snug truncate",
            "hover:text-accent transition-colors",
            "after:absolute after:inset-0 after:content-[''] after:rounded-xl",
            isTerminal ? "line-through" : "",
          ].join(" ")}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              {order.orderNumber != null && (
                <span className="shrink-0 rounded-md border border-line bg-surface-subtle px-1.5 py-0.5 text-xs font-bold tabular-nums text-foreground-muted">
                  #{order.orderNumber}
                </span>
              )}
              {order.customerName}
            </div>
            <StatusBadge
              status={order.status}
              orderStatus={order.orderStatus}
              size="sm"
              className="shrink-0"
            />
          </div>

          {/* Fulfillment row */}
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-foreground-muted">
            {order.fulfillmentType === FulfillmentType.PICKUP ? (
              <StoreIcon className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <TruckIcon className="h-3.5 w-3.5 shrink-0" />
            )}
            <span>{FULFILLMENT_LABELS[order.fulfillmentType]}</span>
            {order.pickupTime && (
              <>
                <span
                  aria-hidden="true"
                  className="text-foreground-muted/40"
                ></span>
                <ClockIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="font-medium text-foreground tabular-nums">
                  {order.pickupTime}
                </span>
              </>
            )}
            {order.deliveryCep && !order.pickupTime && (
              <>
                <span
                  aria-hidden="true"
                  className="text-foreground-muted/40"
                ></span>
                <span>
                  CEP {order.deliveryCep.slice(0, 5)}-
                  {order.deliveryCep.slice(5)}
                </span>
              </>
            )}
            {order.deliveryAddress && (
              <>
                <span
                  aria-hidden="true"
                  className="text-foreground-muted/40"
                ></span>
                <span className="truncate">{order.deliveryAddress}</span>
              </>
            )}
          </div>

          {/* Products summary */}
          <p className="truncate text-sm text-foreground-muted leading-relaxed">
            {order.products.length === 0 ? (
              <span className="italic">Sem itens</span>
            ) : (
              order.products.join("    ")
            )}
          </p>

          {/* Total */}
          <div className="flex items-center justify-between pt-0.5">
            <p className="text-xs text-foreground-muted">Total do pedido</p>
            <p className="font-semibold text-foreground tabular-nums">
              {formatCurrency(order.totalAmount)}
            </p>
          </div>
        </Link>
      </div>

      {/*  Quick-actions footer  */}
      {/* z-10 sits above the stretched-link ::after overlay */}
      {!isTerminal && (
        <div className="relative z-10 border-t border-line bg-surface-subtle/60 px-4 py-2.5">
          <OrderCardQuickActions
            orderId={order.id}
            initialStatus={order.status}
            initialOrderStatus={order.orderStatus}
            customerWhatsapp={order.customerWhatsapp}
            customerName={order.customerName}
            orderNumber={order.orderNumber}
          />
        </div>
      )}
    </article>
  );
}

//  Icons

function StoreIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
