import type { OrderItem, CreateOrderItemInput } from "./OrderItem";

/**
 * IOrderItemRepository — domain port for order line items.
 *
 * Items are append-only by default (price-freezing invariant).
 * The only mutation path is replaceAll(), which is wrapped in a
 * transaction and is only valid while the order is still PENDING.
 *
 * The HTTP layer is responsible for verifying order ownership (storeId)
 * before calling these methods — items themselves do not carry storeId
 * (it can be obtained from the parent Order).
 *
 * Concrete implementation: src/infra/repositories/PrismaOrderItemRepository.ts
 *
 * Future expansions:
 *   ─ findById(id)              — useful for per-item receipt drilling
 *   ─ applyDiscount(id, amount) — targeted discount on a single line
 *   ─ updateNotes(id, notes)    — per-item kitchen instructions
 */
export interface IOrderItemRepository {
  // ─── Queries ──────────────────────────────────────────────────────────────

  /**
   * Returns all items for the given order, ordered by createdAt ascending
   * (i.e. in the order they were added).
   */
  findAllByOrder(orderId: string): Promise<OrderItem[]>;

  // ─── Commands ─────────────────────────────────────────────────────────────

  /**
   * Creates multiple items atomically (single DB transaction).
   * Use this on initial order creation.
   *
   * Callers must validate quantity >= minQuantity via validateItemQuantity()
   * before invoking this method.
   */
  createMany(items: CreateOrderItemInput[]): Promise<OrderItem[]>;

  /**
   * Replaces the entire item set for an order atomically.
   *
   * Executes inside a transaction:
   *   1. DELETE all existing items for orderId.
   *   2. INSERT the new items.
   *
   * Use this when a customer or store edits an order that is still PENDING.
   * The use case layer must gate this behind a status check before calling.
   */
  replaceAll(
    orderId: string,
    items: CreateOrderItemInput[],
  ): Promise<OrderItem[]>;

  /**
   * Removes a single item.
   * Returns true if deleted, false if not found.
   */
  delete(id: string): Promise<boolean>;
}
