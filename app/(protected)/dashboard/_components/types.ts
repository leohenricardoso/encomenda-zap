import type { FulfillmentType, OrderStatus } from "@/domain/order/Order";

/**
 * OrderViewModel — read-only projection of an order for dashboard display.
 *
 * `id` is included here only for admin-internal navigation (detail page URL).
 * Never render it in visible UI text.
 */
export interface OrderViewModel {
  /** Internal order id — used only for navigation links, never displayed. */
  id: string;
  customerName: string;
  /** Normalised digits-only WhatsApp (e.g. "5511999998888"). */
  customerWhatsapp: string;
  /** ISO date "YYYY-MM-DD" — used by the page for grouping. */
  deliveryDate: string;
  /** "HH:mm – HH:mm" label for PICKUP orders; null for DELIVERY. */
  pickupTime: string | null;
  fulfillmentType: FulfillmentType;
  /** Formatted address for DELIVERY orders; null for PICKUP. */
  deliveryAddress: string | null;
  /** 8-digit CEP (raw) for DELIVERY; null for PICKUP. */
  deliveryCep: string | null;
  status: OrderStatus;
  /** Pre-computed sum: (unitPrice − discountAmount) × quantity, in BRL. */
  totalAmount: number;
  /** Pre-formatted item labels: ["2× Bolo de Chocolate (Médio)", "1× Brigadeiro"] */
  products: string[];
}
