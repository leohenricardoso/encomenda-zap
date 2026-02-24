/**
 * Cart session — client-side ephemeral multi-item order state.
 *
 * Stored in sessionStorage — tab-scoped, cleared when the tab closes.
 *
 * Mutation model
 * ──────────────
 * Items are keyed by `cartItemKey(productId, variantId)` so that the same
 * product with different variants is treated as distinct line items, while
 * adding the same product+variant again simply increments the quantity.
 *
 * All mutators are pure functions that return a NEW CartSession (no side
 * effects).  Callers persist the result with `writeCart`.
 */

export const CART_SESSION_KEY = "encomenda_zap:cart";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  variantId: string | null;
  productName: string;
  variantLabel: string | null;
  quantity: number;
  /** Price per unit in BRL — frozen at add time */
  unitPrice: number;
  /** Total for this line: quantity × unitPrice */
  lineTotal: number;
}

/**
 * Full cart snapshot persisted to sessionStorage.
 * storeSlug is stored to validate consistency when pages load.
 */
export interface CartSession {
  storeSlug: string;
  items: CartItem[];
  /** Optional delivery address — collected on the review screen */
  shippingAddress: string | null;
}

// ─── Key helpers ──────────────────────────────────────────────────────────────

/**
 * Stable, unique key for a product + variant combination.
 * Used to find the existing line item in the cart array.
 */
export function cartItemKey(
  productId: string,
  variantId: string | null,
): string {
  return `${productId}::${variantId ?? "__base__"}`;
}

function itemKey(item: Pick<CartItem, "productId" | "variantId">): string {
  return cartItemKey(item.productId, item.variantId);
}

// ─── Storage primitives ───────────────────────────────────────────────────────

/** Reads and parses the cart from sessionStorage. Returns null on any failure. */
export function readCart(): CartSession | null {
  try {
    const raw = sessionStorage.getItem(CART_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CartSession;
  } catch {
    return null;
  }
}

/** Persists the cart to sessionStorage. */
export function writeCart(cart: CartSession): void {
  sessionStorage.setItem(CART_SESSION_KEY, JSON.stringify(cart));
}

/** Clears the cart from sessionStorage. */
export function clearCart(): void {
  sessionStorage.removeItem(CART_SESSION_KEY);
}

// ─── Pure mutators ────────────────────────────────────────────────────────────

/**
 * Adds an item to the cart, or replaces its quantity/price if it already
 * exists with the same product+variant key.
 *
 * When storeSlug differs from the stored cart's storeSlug, the cart is
 * reset — customers can only have one active store per tab.
 */
export function addOrUpdateItem(
  prev: CartSession | null,
  storeSlug: string,
  incoming: Omit<CartItem, "lineTotal">,
): CartSession {
  const base: CartSession =
    prev && prev.storeSlug === storeSlug
      ? prev
      : { storeSlug, items: [], shippingAddress: null };

  const key = cartItemKey(incoming.productId, incoming.variantId);
  const exists = base.items.some((i) => itemKey(i) === key);

  const updated = exists
    ? base.items.map((i) =>
        itemKey(i) === key
          ? {
              ...i,
              quantity: incoming.quantity,
              unitPrice: incoming.unitPrice,
              lineTotal: incoming.quantity * incoming.unitPrice,
            }
          : i,
      )
    : [
        ...base.items,
        {
          ...incoming,
          lineTotal: incoming.quantity * incoming.unitPrice,
        },
      ];

  return { ...base, items: updated };
}

/**
 * Removes a line item from the cart by its product+variant key.
 * Returns null when the cart becomes empty (caller should clear & redirect).
 */
export function removeItem(
  cart: CartSession,
  productId: string,
  variantId: string | null,
): CartSession {
  const key = cartItemKey(productId, variantId);
  return {
    ...cart,
    items: cart.items.filter((i) => itemKey(i) !== key),
  };
}

/**
 * Updates the quantity of an existing line item.
 * If quantity < minQuantity the item is removed entirely.
 * `minQuantity` defaults to 1.
 */
export function updateItemQuantity(
  cart: CartSession,
  productId: string,
  variantId: string | null,
  newQuantity: number,
  minQuantity = 1,
): CartSession {
  if (newQuantity < minQuantity) {
    return removeItem(cart, productId, variantId);
  }
  const key = cartItemKey(productId, variantId);
  return {
    ...cart,
    items: cart.items.map((i) =>
      itemKey(i) === key
        ? { ...i, quantity: newQuantity, lineTotal: newQuantity * i.unitPrice }
        : i,
    ),
  };
}

// ─── Derived helpers ──────────────────────────────────────────────────────────

/** Total number of individual items (sum of quantities) in the cart. */
export function cartTotalQty(cart: CartSession | null): number {
  return cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;
}

/** Grand total price of the cart. */
export function cartGrandTotal(cart: CartSession | null): number {
  return cart?.items.reduce((s, i) => s + i.lineTotal, 0) ?? 0;
}
