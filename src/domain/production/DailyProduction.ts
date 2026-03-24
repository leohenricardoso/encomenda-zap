/**
 * DailyProduction — read model for the "Produção do Dia" dashboard page.
 *
 * This is a pure view aggregate computed by GetDailyProductionUseCase.
 * It has no identity / lifecycle of its own — it is rebuilt fresh on every
 * request from Order + OrderItem data plus the checklist persistence layer.
 *
 * Hierarchy:
 *   DailyProductionGroup (one per category)
 *     └── DailyProductionItem (one per product + variant combination)
 *           └── DailyProductionOrderRef (one per contributing order)
 */

// ─── Order reference within a production item ─────────────────────────────────

/**
 * A minimal reference to the order that contributes units to a production item.
 * Used in the "Ver pedidos" drawer to trace back from production to order.
 */
export interface DailyProductionOrderRef {
  /** Internal order UUID — used as a link to the detail page. */
  orderId: string;
  /** Human-friendly sequential number (e.g. 42). Null for legacy orders. */
  incrementId: number | null;
  /** Customer display name. */
  customerName: string;
  /** Units of this specific product+variant contributed by this order. */
  quantity: number;
  /** Pickup time window, e.g. "09:00 – 12:00". Null for delivery orders. */
  deliveryTime: string | null;
  /** Digits-only WhatsApp number for quick-action button. */
  customerWhatsapp: string;
  /** Customer observation note. Null if none. */
  notes: string | null;
}

// ─── Aggregated production item ───────────────────────────────────────────────

/**
 * A single production line: one product+variant combination with the total
 * quantity to produce and the list of orders that requested it.
 */
export interface DailyProductionItem {
  /**
   * Composite key used for checklist DB persistence.
   * Format: "${productId}::${variantId ?? 'no-variant'}"
   */
  itemKey: string;
  /** Product name snapshot (from the order item). */
  productName: string;
  /** Variant label snapshot, e.g. "500g" or "G". Null for simple products. */
  variationLabel: string | null;
  /** Sum of all order quantities for this product+variant on this date. */
  totalQuantity: number;
  /** Whether this item has been marked as produced in the checklist. */
  produced: boolean;
  /** All orders that requested this item, sorted by deliveryTime then incrementId. */
  orders: DailyProductionOrderRef[];
}

// ─── Category group ───────────────────────────────────────────────────────────

/**
 * All production items belonging to the same primary category.
 * Items with no category are grouped under "Sem categoria".
 */
export interface DailyProductionGroup {
  /** Category display name, or "Sem categoria" for uncategorised products. */
  categoryName: string;
  /** Items sorted by totalQuantity descending. */
  items: DailyProductionItem[];
}
