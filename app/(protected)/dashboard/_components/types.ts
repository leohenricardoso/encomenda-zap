import type { FulfillmentType, OrderStatus } from "@/domain/order/Order";

/**
 * OrderViewModel — read-only projection of an order for dashboard display.
 *
 * All internal IDs (orderId, customerId, storeId, pickupSlotId) are stripped.
 * Computed fields (totalAmount, products, deliveryAddress) are pre-formatted
 * server-side so components stay pure/presentational.
 */
export interface OrderViewModel {
  customerName: string;
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
  /** Pre-computed sum: (unitPrice − discountAmount) × quantity, in BRL cents. */
  totalAmount: number;
  /** Pre-formatted item labels: ["2× Bolo de Chocolate (Médio)", "1× Brigadeiro"] */
  products: string[];
}
