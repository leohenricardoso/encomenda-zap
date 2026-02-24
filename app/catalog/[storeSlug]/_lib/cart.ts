/**
 * Cart session — client-side ephemeral order state.
 *
 * Stored in sessionStorage so data is tab-scoped and cleared on close.
 * Written by OrderProductSection when the customer clicks "Encomendar".
 * Read by OrderReviewClient to populate the confirmation screen.
 */

export const CART_SESSION_KEY = "encomenda_zap:cart";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  variantId: string | null;
  productName: string;
  variantLabel: string | null;
  quantity: number;
  /** Price per unit in BRL (integer centavos or float — same as DB) */
  unitPrice: number;
  lineTotal: number;
}

/**
 * Full cart snapshot persisted to sessionStorage.
 * storeSlug is stored to validate consistency when the review page loads.
 */
export interface CartSession {
  storeSlug: string;
  items: CartItem[];
  /** Optional delivery address — collected on the review screen */
  shippingAddress: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
