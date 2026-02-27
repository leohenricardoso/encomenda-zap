import type {
  Order,
  OrderStatus,
  OrderWithDetails,
  CreateOrderInput,
  UpdateOrderInput,
  OrderFilters,
} from "./Order";
import type { OrderItem } from "./OrderItem";

/**
 * IOrderRepository — domain port (interface).
 *
 * All mutating methods are scoped by storeId to enforce multi-tenant
 * isolation.  The concrete implementation lives in:
 *   src/infra/repositories/PrismaOrderRepository.ts
 *
 * Status transitions are a separate method (updateStatus) — this keeps the
 * state-machine contract explicit and prevents accidental status overwrite
 * via a generic update().
 *
 * Future expansions:
 *   ─ countByStatus() — dashboard KPIs without loading full rows
 */
export interface IOrderRepository {
  // ─── Queries ────────────────────────────────────────────────────────────────

  /**
   * Returns all orders for the store, ordered by deliveryDate ascending.
   * Accepts optional filters for status, customer and date range.
   */
  findAllByStore(storeId: string, filters?: OrderFilters): Promise<Order[]>;

  /**
   * Returns orders for the store with customer name and line items joined.
   * Used by dashboard/agenda views — read-model only, never used in commands.
   */
  findAllByStoreWithDetails(
    storeId: string,
    filters?: OrderFilters,
  ): Promise<OrderWithDetails[]>;

  /**
   * Returns a single order by id, tenant-scoped. Null if not found.
   */
  findById(id: string, storeId: string): Promise<Order | null>;

  /**
   * Returns a single order with its items eagerly loaded.
   * Useful for receipt, confirmation and review pages.
   * Null if the order does not belong to the store.
   */
  findByIdWithItems(
    id: string,
    storeId: string,
  ): Promise<(Order & { items: OrderItem[] }) | null>;

  /**
   * Returns all orders placed by a specific customer within the store,
   * ordered by createdAt descending (most recent first).
   * Ready for order-history and re-order features.
   */
  findAllByCustomer(customerId: string, storeId: string): Promise<Order[]>;

  // ─── Commands ───────────────────────────────────────────────────────────────

  /**
   * Creates a new order.  Status is always PENDING — domain invariant
   * enforced here and in the Prisma model default.
   */
  create(input: CreateOrderInput): Promise<Order>;

  /**
   * Updates mutable logistics fields (deliveryDate, shippingAddress).
   * Returns null when the order is not found or doesn't belong to the store.
   */
  update(
    id: string,
    storeId: string,
    input: UpdateOrderInput,
  ): Promise<Order | null>;

  /**
   * Transitions the order to a new status.
   *
   * Responsibilities:
   *   1. Verify the order belongs to the store.
   *   2. Validate the transition is allowed (via canTransitionTo()).
   *   3. Persist the new status and return the updated entity.
   *
   * Returns null  → order not found.
   * Throws Error  → transition not allowed (use canTransitionTo() to pre-check
   *                 and return a 409 Conflict in the HTTP layer).
   */
  updateStatus(
    id: string,
    storeId: string,
    newStatus: OrderStatus,
  ): Promise<Order | null>;

  /**
   * Hard-deletes an order.  Returns true if deleted, false if not found.
   *
   * Intended for admin-level cleanup only.  In most workflows, prefer
   * transitioning to REJECTED to keep audit history.
   */
  delete(id: string, storeId: string): Promise<boolean>;
}
