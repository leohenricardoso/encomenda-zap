/**
 * OrderItem domain model — pure TypeScript, no Prisma, no Next.js, no HTTP.
 *
 * Design rationale:
 * ─ An OrderItem is an immutable snapshot of what was purchased.
 *   Once created, prices and names NEVER change — even if the store later
 *   edits the product.  This is the core "price freezing" invariant.
 * ─ productName and variantLabel are snapshot fields — they capture the
 *   display strings at order time so receipts and history views remain
 *   accurate regardless of future catalogue edits.
 * ─ discountAmount is stored per-unit at 0 by default.  When a coupon
 *   or loyalty discount feature is introduced, it populates this field
 *   without requiring any schema change.
 * ─ There is no updatedAt — items are append-only.  Editing an order
 *   replaces the item set (via IOrderItemRepository.replaceAll) rather
 *   than mutating individual items.
 *
 * Planned expansions:
 *   ─ couponCode / couponId   — reference to the discount applied
 *   ─ notes                   — per-item customer instructions ("sem glúten")
 *   ─ tax                     — per-unit tax amount for fiscal notes
 */

// ─── OrderItem entity ─────────────────────────────────────────────────────────

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  /** Null for simple products (no variants selected). */
  variantId: string | null;
  /**
   * Snapshot of the product name at order time.
   * Survives future catalogue renames — historical orders stay accurate.
   */
  productName: string;
  /**
   * Snapshot of the variant label at order time (e.g. "500g", "G", "Chocolate").
   * Null when no variant was selected.
   */
  variantLabel: string | null;
  /**
   * Number of units ordered.
   * Must be >= the product's minQuantity at the time of order creation.
   */
  quantity: number;
  /**
   * Price per unit at order creation — frozen forever.
   * Taken from the variant price when variantId is set, otherwise from
   * the product's base price.  Callers are responsible for providing the
   * correct value; the domain never fetches prices itself.
   */
  unitPrice: number;
  /**
   * Discount applied per unit at order time.
   * Defaults to 0.  Future coupon / loyalty features populate this field.
   * lineTotal = (unitPrice - discountAmount) * quantity
   */
  discountAmount: number;
  createdAt: Date;
}

// ─── Domain helpers ───────────────────────────────────────────────────────────

/**
 * computeLineTotal — pure function, no side effects.
 * Returns the total cost for a single line item after discount.
 *
 * @example
 *   computeLineTotal({ unitPrice: 29.90, discountAmount: 5, quantity: 2 })
 *   // → 49.80
 */
export function computeLineTotal(
  item: Pick<OrderItem, "unitPrice" | "discountAmount" | "quantity">,
): number {
  return (item.unitPrice - item.discountAmount) * item.quantity;
}

/**
 * computeOrderTotal — sums all line totals for a complete order.
 */
export function computeOrderTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + computeLineTotal(item), 0);
}

/**
 * validateItemQuantity — enforces the product's minQuantity invariant.
 *
 * Call this in the use case / service layer before persisting items.
 * Throws a plain Error so HTTP controllers can catch it and return 422.
 *
 * @param quantity    - the quantity the customer wants to order
 * @param minQuantity - the product's minimum order quantity
 * @param productName - included in the error message for clarity
 */
export function validateItemQuantity(
  quantity: number,
  minQuantity: number,
  productName: string,
): void {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error(
      `Quantity for "${productName}" must be a positive integer.`,
    );
  }
  if (quantity < minQuantity) {
    throw new Error(
      `Minimum quantity for "${productName}" is ${minQuantity} (received ${quantity}).`,
    );
  }
}

// ─── Input types ─────────────────────────────────────────────────────────────

export interface CreateOrderItemInput {
  orderId: string;
  productId: string;
  /** Null for simple products. */
  variantId?: string | null;
  /** Snapshot — caller must supply the name at the time of ordering. */
  productName: string;
  /** Snapshot — caller must supply the label at the time of ordering. */
  variantLabel?: string | null;
  quantity: number;
  /**
   * Unit price frozen at order time.
   * Caller must read the current product/variant price and pass it here.
   * The repository NEVER accesses products to infer prices.
   */
  unitPrice: number;
  /**
   * Optional per-unit discount. Defaults to 0 when omitted.
   * Future: populated by coupon / loyalty discount use cases.
   */
  discountAmount?: number;
}
