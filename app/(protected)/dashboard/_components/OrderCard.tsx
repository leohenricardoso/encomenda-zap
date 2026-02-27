import Link from "next/link";
import type { OrderViewModel } from "./types";
import { OrderStatus, FulfillmentType } from "@/domain/order/Order";

// ─── Config maps ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; badgeClass: string; accentClass: string }
> = {
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

const FULFILLMENT_LABELS: Record<FulfillmentType, string> = {
  [FulfillmentType.PICKUP]: "Retirada",
  [FulfillmentType.DELIVERY]: "Entrega",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// ─── Component ────────────────────────────────────────────────────────────────

interface OrderCardProps {
  order: OrderViewModel;
}

/**
 * OrderCard — presentation-only card for a single order.
 *
 * Displays: customer name, status badge, fulfillment type + time/address,
 * product list, and total amount.  No IDs are rendered.
 *
 * Server Component — no interactivity.  Optimistic status actions belong
 * in a future "update-status" client wrapper.
 */
export function OrderCard({ order }: OrderCardProps) {
  const cfg = STATUS_CONFIG[order.status];
  const isRejected = order.status === OrderStatus.REJECTED;

  return (
    <article
      className={[
        "overflow-hidden rounded-xl border border-line bg-surface",
        isRejected ? "opacity-55" : "",
      ].join(" ")}
    >
      <div className={["flex flex-col gap-3 p-4", cfg.accentClass].join(" ")}>
        {/* ── Header: customer + status ──────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3">
          <p
            className={[
              "font-semibold text-foreground leading-snug",
              isRejected ? "line-through" : "",
            ].join(" ")}
          >
            {order.customerName}
          </p>
          <span
            className={[
              "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
              cfg.badgeClass,
            ].join(" ")}
          >
            {cfg.label}
          </span>
        </div>

        {/* ── Fulfillment row ────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-foreground-muted">
          {/* Icon */}
          {order.fulfillmentType === FulfillmentType.PICKUP ? (
            <StoreIcon className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <TruckIcon className="h-3.5 w-3.5 shrink-0" />
          )}

          {/* Type label */}
          <span>{FULFILLMENT_LABELS[order.fulfillmentType]}</span>

          {/* Pickup time */}
          {order.pickupTime && (
            <>
              <span aria-hidden="true" className="text-foreground-muted/40">
                ·
              </span>
              <ClockIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="font-medium text-foreground tabular-nums">
                {order.pickupTime}
              </span>
            </>
          )}

          {/* Delivery address */}
          {order.deliveryCep && !order.pickupTime && (
            <>
              <span aria-hidden="true" className="text-foreground-muted/40">
                ·
              </span>
              <span className="truncate">
                CEP {order.deliveryCep.slice(0, 5)}-{order.deliveryCep.slice(5)}
              </span>
            </>
          )}
          {order.deliveryAddress && (
            <>
              <span aria-hidden="true" className="text-foreground-muted/40">
                ·
              </span>
              <span className="truncate">{order.deliveryAddress}</span>
            </>
          )}
        </div>

        {/* ── Products ───────────────────────────────────────────────────── */}
        <p className="text-sm text-foreground-muted leading-relaxed">
          {order.products.length === 0 ? (
            <span className="italic">Sem itens</span>
          ) : (
            order.products.join("  ·  ")
          )}
        </p>

        {/* ── Total + link ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-t border-line pt-2">
          <Link
            href={`/dashboard/orders/${order.id}`}
            className="text-xs font-medium text-accent hover:underline"
          >
            Ver detalhes →
          </Link>
          <span className="font-semibold text-foreground tabular-nums">
            {formatCurrency(order.totalAmount)}
          </span>
        </div>
      </div>
    </article>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

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
