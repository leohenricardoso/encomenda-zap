import { notFound } from "next/navigation";
import { getSession } from "@/infra/http/auth/getSession";
import {
  getOrderUseCase,
  getStoreMessagesUseCase,
  getStorePickupAddressUseCase,
} from "@/infra/composition";
import { OrderStatusManager } from "../../_components/OrderStatusManager";
import { OrderDetailHeader } from "./_components/OrderDetailHeader";
import { OrderItemsCard } from "./_components/OrderItemsCard";
import { OrderNotesCard } from "./_components/OrderNotesCard";
import { CustomerInfoCard } from "./_components/CustomerInfoCard";
import { LogisticsCard } from "./_components/LogisticsCard";
import { FinancialSummaryCard } from "./_components/FinancialSummaryCard";
import { formatLongDate } from "./_components/helpers";
import {
  DEFAULT_MESSAGES,
  resolveMessage,
  type MessageVars,
} from "@/domain/store/StoreMessageConfig";

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ orderId: string }>;
}

export default async function OrderDetailPage({ params }: Props) {
  const [session, { orderId }] = await Promise.all([getSession(), params]);

  const [order, msgConfig, pickupAddress] = await Promise.all([
    getOrderUseCase.execute(orderId, session.storeId),
    getStoreMessagesUseCase.execute(session.storeId),
    getStorePickupAddressUseCase.execute(session.storeId),
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

  const subtotal = order.items.reduce(
    (sum, item) => sum + (item.unitPrice - item.discountAmount) * item.quantity,
    0,
  );
  const totalAmount = subtotal + order.deliveryFee;

  return (
    /*
     * Two-column layout on desktop (md+): main column (2fr) + sidebar (1fr).
     * Mobile: single-column, priority order top-to-bottom.
     */
    <div className="min-h-dvh flex flex-col">
      {/* ── Sticky page header ───────────────────────────────────────────── */}
      <OrderDetailHeader
        orderNumber={order.orderNumber}
        customerName={order.customerName}
        deliveryDate={order.deliveryDate}
        fulfillmentType={order.fulfillmentType}
        totalAmount={totalAmount}
        status={order.status}
        trackingStatus={order.orderStatus}
      />

      {/* ── Content grid ─────────────────────────────────────────────────── */}
      <div className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6 items-start">
            {/* ══ Main column ══════════════════════════════════════════════ */}
            <div className="flex flex-col gap-6">
              {/* 1. Status management — first so staff can act immediately */}
              <OrderStatusManager
                orderId={order.id}
                initialDecisionStatus={order.status}
                initialTrackingStatus={order.orderStatus}
                approvalWaUrl={approvalWaUrl}
                rejectionWaUrl={rejectionWaUrl}
              />

              {/* 2. Order items — operational preparation list */}
              <OrderItemsCard items={order.items} />

              {/* 3. Customer notes — highlighted only when present */}
              {order.notes && <OrderNotesCard notes={order.notes} />}
            </div>

            {/* ══ Sidebar ══════════════════════════════════════════════════ */}
            <div className="flex flex-col gap-6">
              {/* 4. Customer info + WhatsApp */}
              <CustomerInfoCard
                name={order.customerName}
                whatsapp={order.customerWhatsapp}
                orderNumber={order.orderNumber}
              />

              {/* 5. Logistics — delivery vs pickup details */}
              <LogisticsCard
                fulfillmentType={order.fulfillmentType}
                deliveryDate={order.deliveryDate}
                pickupTime={order.pickupTime}
                pickupAddress={pickupAddress}
                deliveryCep={order.deliveryCep}
                deliveryStreet={order.deliveryStreet}
                deliveryNumber={order.deliveryNumber}
                deliveryNeighborhood={order.deliveryNeighborhood}
                deliveryCity={order.deliveryCity}
                shippingAddress={order.shippingAddress}
              />

              {/* 6. Financial summary — subtotal, delivery fee, total */}
              <FinancialSummaryCard
                items={order.items}
                deliveryFee={order.deliveryFee}
                fulfillmentType={order.fulfillmentType}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
