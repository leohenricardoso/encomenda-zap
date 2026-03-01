import { notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/infra/http/auth/getSession";
import { getOrderUseCase, getStoreMessagesUseCase } from "@/infra/composition";
import { CustomerSection } from "./_components/CustomerSection";
import { LogisticsSection } from "./_components/LogisticsSection";
import { ItemsSection } from "./_components/ItemsSection";
import { StatusActions } from "./_components/StatusActions";
import { formatLongDate, formatCurrency } from "./_components/helpers";
import { OrderStatus } from "@/domain/order/Order";
import {
  DEFAULT_MESSAGES,
  resolveMessage,
  type MessageVars,
} from "@/domain/store/StoreMessageConfig";

// ─── Status badge config (server render) ─────────────────────────────────────

const STATUS_BADGE: Record<OrderStatus, { label: string; className: string }> =
  {
    [OrderStatus.PENDING]: {
      label: "Pendente",
      className: "bg-amber-100 text-amber-800",
    },
    [OrderStatus.APPROVED]: {
      label: "Aprovado",
      className: "bg-green-100 text-green-800",
    },
    [OrderStatus.REJECTED]: {
      label: "Recusado",
      className: "bg-surface-hover text-foreground-muted",
    },
  };

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ orderId: string }>;
}

export default async function OrderDetailPage({ params }: Props) {
  const [session, { orderId }] = await Promise.all([getSession(), params]);

  const [order, msgConfig] = await Promise.all([
    getOrderUseCase.execute(orderId, session.storeId),
    getStoreMessagesUseCase.execute(session.storeId),
  ]);
  if (!order) notFound();

  // ── Build per-action WhatsApp URLs ────────────────────────────────────────
  const firstName =
    order.customerName.trim().split(/\s+/)[0] ?? order.customerName.trim();
  const messageVars: MessageVars = {
    cliente: firstName,
    pedido: order.orderNumber?.toString() ?? "—",
    data: formatLongDate(order.deliveryDate),
  };
  const waDigits = order.customerWhatsapp.replace(/\D/g, "");

  const approvalWaUrl = `https://wa.me/${waDigits}?text=${encodeURIComponent(
    resolveMessage(
      msgConfig?.approvalMessage ?? null,
      DEFAULT_MESSAGES.approval,
      messageVars,
    ),
  )}`;
  const rejectionWaUrl = `https://wa.me/${waDigits}?text=${encodeURIComponent(
    resolveMessage(
      msgConfig?.rejectionMessage ?? null,
      DEFAULT_MESSAGES.rejection,
      messageVars,
    ),
  )}`;

  const badge = STATUS_BADGE[order.status];
  const totalAmount = order.items.reduce(
    (sum, item) => sum + (item.unitPrice - item.discountAmount) * item.quantity,
    0,
  );

  return (
    /*
     * Mobile: single column. Desktop: max-width centred.
     * StatusActions is sticky-bottom on mobile, relative inside the flow on sm+.
     */
    <div className="min-h-dvh flex flex-col pb-24 sm:pb-0">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 border-b border-line bg-surface/95 backdrop-blur-sm px-4 py-3">
        <div className="mx-auto max-w-2xl flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar</span>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {order.orderNumber != null && (
                <span className="shrink-0 rounded-md bg-foreground px-1.5 py-0.5 text-xs font-bold tabular-nums text-surface">
                  #{order.orderNumber}
                </span>
              )}
              <p className="font-semibold text-foreground truncate leading-snug">
                {order.customerName}
              </p>
            </div>
            <p className="text-xs text-foreground-muted capitalize">
              {formatLongDate(order.deliveryDate)}
            </p>
          </div>
          <span
            className={[
              "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold sm:hidden",
              badge.className,
            ].join(" ")}
          >
            {badge.label}
          </span>
          <span className="hidden sm:inline text-sm font-bold text-foreground tabular-nums">
            {formatCurrency(totalAmount)}
          </span>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* ── Customer ──────────────────────────────────────────────────── */}
          <CustomerSection
            name={order.customerName}
            whatsapp={order.customerWhatsapp}
            orderNumber={order.orderNumber}
          />

          {/* ── Logistics ─────────────────────────────────────────────────── */}
          <LogisticsSection
            fulfillmentType={order.fulfillmentType}
            deliveryDate={order.deliveryDate}
            pickupTime={order.pickupTime}
            deliveryCep={order.deliveryCep}
            deliveryStreet={order.deliveryStreet}
            deliveryNumber={order.deliveryNumber}
            deliveryNeighborhood={order.deliveryNeighborhood}
            deliveryCity={order.deliveryCity}
            shippingAddress={order.shippingAddress}
          />

          {/* ── Items ─────────────────────────────────────────────────────── */}
          <ItemsSection items={order.items} />

          {/* ── Customer notes ────────────────────────────────────────────── */}
          {order.notes && (
            <section
              aria-label="Observações do cliente"
              className="rounded-xl border border-line bg-amber-50 px-4 py-4"
            >
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-amber-700">
                Observações do cliente
              </p>
              <p className="text-sm text-amber-900 whitespace-pre-line leading-relaxed">
                {order.notes}
              </p>
            </section>
          )}

          {/* ── Actions (sm+: rendered inline below items) ────────────────── */}
          <div className="hidden sm:block">
            <StatusActions
              orderId={order.id}
              currentStatus={order.status}
              approvalWaUrl={approvalWaUrl}
              rejectionWaUrl={rejectionWaUrl}
            />
          </div>
        </div>
      </div>

      {/* ── Actions (mobile: sticky bottom) ─────────────────────────────── */}
      <div className="sm:hidden">
        <StatusActions
          orderId={order.id}
          currentStatus={order.status}
          approvalWaUrl={approvalWaUrl}
          rejectionWaUrl={rejectionWaUrl}
        />
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
