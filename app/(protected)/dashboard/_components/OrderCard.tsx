import Link from "next/link";
import type { OrderViewModel } from "./types";
import { OrderStatus, FulfillmentType } from "@/domain/order/Order";
import { StatusBadge, STATUS_CONFIG } from "./StatusBadge";
import { whatsAppUrl } from "../orders/[orderId]/_components/helpers";

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
          <div className="flex items-center gap-2 min-w-0">
            {order.orderNumber != null && (
              <span className="shrink-0 rounded-md bg-foreground/10 px-1.5 py-0.5 text-xs font-bold tabular-nums text-foreground">
                #{order.orderNumber}
              </span>
            )}
            <p
              className={[
                "font-semibold text-foreground leading-snug truncate",
                isRejected ? "line-through" : "",
              ].join(" ")}
            >
              {order.customerName}
            </p>
          </div>
          <StatusBadge status={order.status} size="sm" className="shrink-0" />
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
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/orders/${order.id}`}
              className="text-xs font-medium text-accent hover:underline"
            >
              Ver detalhes →
            </Link>
            <a
              href={whatsAppUrl(order.customerWhatsapp, order.customerName, order.orderNumber)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Contatar ${order.customerName} via WhatsApp`}
              title="Contatar via WhatsApp"
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-[#25D366] hover:bg-[#25D366]/10 transition-colors"
            >
              <WhatsAppIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          </div>
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

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M16 2C8.268 2 2 8.268 2 16c0 2.522.667 4.89 1.834 6.938L2 30l7.281-1.906A13.94 13.94 0 0 0 16 30c7.732 0 14-6.268 14-14S23.732 2 16 2Zm0 25.5a11.44 11.44 0 0 1-5.844-1.594l-.418-.25-4.328 1.134 1.156-4.219-.274-.434A11.46 11.46 0 0 1 4.5 16C4.5 9.648 9.648 4.5 16 4.5S27.5 9.648 27.5 16 22.352 27.5 16 27.5Zm6.29-8.563c-.344-.172-2.031-1-2.344-1.115-.312-.109-.54-.172-.765.172-.225.344-.875 1.115-1.072 1.344-.197.225-.393.253-.737.082-.344-.172-1.453-.535-2.766-1.703-1.022-.91-1.712-2.035-1.912-2.379-.197-.344-.022-.531.15-.703.153-.153.344-.397.516-.594.172-.197.225-.344.337-.572.113-.225.056-.422-.028-.594-.084-.172-.765-1.844-1.047-2.525-.278-.66-.559-.572-.765-.581-.197-.009-.422-.013-.647-.013-.225 0-.59.084-.9.422-.31.337-1.175 1.147-1.175 2.797s1.203 3.244 1.372 3.469c.172.225 2.375 3.625 5.75 5.082.803.347 1.431.553 1.919.706.806.256 1.541.22 2.122.134.647-.097 2.031-.831 2.316-1.635.281-.803.281-1.491.197-1.635-.081-.144-.306-.228-.65-.4Z" />
    </svg>
  );
}
