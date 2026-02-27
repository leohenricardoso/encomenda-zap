/**
 * Order domain model — pure TypeScript, no Prisma, no Next.js, no HTTP.
 *
 * Design rationale:
 * ─ An Order is always scoped to a Store (multi-tenancy) AND to a Customer.
 * ─ Status transitions are modelled as a finite-state machine so that
 *   invalid transitions are rejected at the domain layer, before touching
 *   the database.  Adding new statuses (e.g. IN_DELIVERY, PAID) only
 *   requires adding an entry to the enum and to ALLOWED_TRANSITIONS.
 * ─ shippingAddress is nullable to support pickup orders.
 * ─ deliveryDate is mandatory — the store always needs to know when to
 *   prepare the order.
 *
 * Planned expansions:
 *   ─ Payment       — payment intent / confirmation reference
 *   ─ StatusHistory — audit trail of every transition with actor + timestamp
 */

// ─── OrderStatus ─────────────────────────────────────────────────────────────

/**
 * All possible lifecycle states of an Order.
 *
 * PENDING  — created, awaiting store review.
 * APPROVED — store accepted the order.
 * REJECTED — store declined the order (out of stock, out of delivery area, etc.).
 *
 * Future additions example:
 *   IN_PREPARATION — store started preparing.
 *   IN_DELIVERY    — handed off to a courier.
 *   DELIVERED      — confirmed delivery.
 *   PAID           — payment confirmed.
 *   CANCELLED      — cancelled by the customer before approval.
 */
export enum OrderStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

// ─── FulfillmentType ──────────────────────────────────────────────────────────────

/**
 * How the customer wants to receive the order.
 * PICKUP   — customer collects at the store.
 * DELIVERY — home delivery to the customer’s address.
 */
export enum FulfillmentType {
  PICKUP = "PICKUP",
  DELIVERY = "DELIVERY",
}

// ─── Status transition machine ───────────────────────────────────────────────

/**
 * ALLOWED_TRANSITIONS defines the finite-state machine for order lifecycle.
 *
 * Each key is the current state; the value is the set of states it can
 * move to.  Transitions NOT listed here are forbidden at the domain layer.
 *
 * To expand the state machine:
 *   1. Add values to OrderStatus.
 *   2. Add their entries to this map.
 *   3. Update use cases/controllers accordingly.
 *
 * Current graph:
 *   PENDING  → APPROVED | REJECTED
 *   APPROVED → REJECTED              (store can still decline after approval)
 *   REJECTED → (terminal — no further transitions)
 */
export const ALLOWED_TRANSITIONS: Readonly<
  Record<OrderStatus, ReadonlyArray<OrderStatus>>
> = {
  [OrderStatus.PENDING]: [OrderStatus.APPROVED, OrderStatus.REJECTED],
  [OrderStatus.APPROVED]: [OrderStatus.REJECTED],
  [OrderStatus.REJECTED]: [],
};

/**
 * canTransitionTo — pure predicate used by use cases and the repository.
 *
 * @example
 *   canTransitionTo(OrderStatus.PENDING, OrderStatus.APPROVED) // true
 *   canTransitionTo(OrderStatus.REJECTED, OrderStatus.APPROVED) // false
 */
export function canTransitionTo(
  current: OrderStatus,
  next: OrderStatus,
): boolean {
  return (ALLOWED_TRANSITIONS[current] as OrderStatus[]).includes(next);
}

// ─── Order entity ─────────────────────────────────────────────────────────────

export interface Order {
  id: string;
  storeId: string;
  customerId: string;
  /**
   * When the order should be ready / delivered.
   * Stored as a full DateTime — time component allows morning vs afternoon
   * slots to be modelled correctly.
   */
  deliveryDate: Date;
  /** How the order is fulfilled — PICKUP at store or DELIVERY to address. */
  fulfillmentType: FulfillmentType;
  // ─ PICKUP fields ───────────────────────────────────────────────────
  /** Human-readable slot label e.g. "09:00 – 12:00". PICKUP only. */
  pickupTime: string | null;
  /** FK to StorePickupSlot. PICKUP only. */
  pickupSlotId: string | null;
  // ─ DELIVERY fields ──────────────────────────────────────────────
  /** 8-digit CEP (no hyphen). DELIVERY only. */
  deliveryCep: string | null;
  deliveryStreet: string | null;
  deliveryNumber: string | null;
  deliveryNeighborhood: string | null;
  deliveryCity: string | null;
  /** Legacy free-text address — kept for backward compat. */
  shippingAddress: string | null;
  /** Optional free-text note written by the customer at order time. */
  notes: string | null;
  /** Current lifecycle state — always starts as PENDING. */
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Input types ─────────────────────────────────────────────────────────────

export interface CreateOrderInput {
  storeId: string;
  customerId: string;
  deliveryDate: Date;
  fulfillmentType: FulfillmentType;
  // PICKUP
  pickupTime?: string | null;
  pickupSlotId?: string | null;
  // DELIVERY
  deliveryCep?: string | null;
  deliveryStreet?: string | null;
  deliveryNumber?: string | null;
  deliveryNeighborhood?: string | null;
  deliveryCity?: string | null;
  /** Legacy free-text address (auto-computed from structured fields). */
  shippingAddress?:
    | string
    | null; /** Optional customer note for the order. Persisted as-is. */
  notes?: string | null; /**
   * Not accepted here — new orders always start as PENDING (domain invariant).
   * Status is driven exclusively through IOrderRepository.updateStatus().
   */
}

/**
 * UpdateOrderInput — fields a store owner can change while the order is open.
 *
 * Status is intentionally excluded: use IOrderRepository.updateStatus() so
 * that all transition validation is co-located in one place.
 */
export interface UpdateOrderInput {
  deliveryDate?: Date;
  fulfillmentType?: FulfillmentType;
  pickupTime?: string | null;
  pickupSlotId?: string | null;
  deliveryCep?: string | null;
  deliveryStreet?: string | null;
  deliveryNumber?: string | null;
  deliveryNeighborhood?: string | null;
  deliveryCity?: string | null;
  shippingAddress?: string | null;
}

/**
 * OrderWithDetails — Order joined with its customer info and line items.
 * Used exclusively for read-model views (dashboard, history).
 * Does NOT replace Order in commands — mutations still operate on bare Order.
 */
export interface OrderWithDetails extends Order {
  /** Snapshot of the customer's name at query time. */
  customerName: string;
  /** Normalised digits-only WhatsApp number (e.g. "5511999998888"). */
  customerWhatsapp: string;
  /** Line items for this order. */
  items: import("./OrderItem").OrderItem[];
}

/**
 * OrderFilters — optional query constraints for findAllByStore.
 *
 * All fields are additive (AND-combined).
 * Designed to be extended with pagination, date ranges, etc.
 */
export interface OrderFilters {
  /** Filter by one or more statuses. Omit to return all. */
  status?: OrderStatus | OrderStatus[];
  /** Filter orders for a specific customer within the store. */
  customerId?: string;
  /** Only orders with deliveryDate >= this value. */
  deliveryDateFrom?: Date;
  /** Only orders with deliveryDate <= this value. */
  deliveryDateTo?: Date;
}
