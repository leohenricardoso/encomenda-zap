"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  readCart,
  writeCart,
  removeItem,
  updateItemQuantity,
  setNotes,
  clearCart,
  cartGrandTotal,
} from "../_lib/cart";
import type { CartSession } from "../_lib/cart";
import { CUSTOMER_SESSION_KEY } from "../identificar/_components/CustomerIdentityForm";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ─── Types ────────────────────────────────────────────────────────────────────

interface CartDrawerProps {
  storeSlug: string;
  isOpen: boolean;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * CartDrawer — slide-up bottom sheet showing the full cart state.
 *
 * Responsibilities:
 *  • Display all line items with per-item quantity stepper and remove button.
 *  • Allow the customer to write an optional "observações" note.
 *  • Navigate to /identificar or /pedido/data on "Finalizar pedido".
 *
 * Cart mutations (quantity change, remove, notes) are applied immediately to
 * sessionStorage and reflected in local state; a `cart:updated` event is
 * dispatched so other components (CartFloatingBar) stay in sync.
 */
export function CartDrawer({ storeSlug, isOpen, onClose }: CartDrawerProps) {
  const router = useRouter();
  const [cart, setCart] = useState<CartSession | null>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  // ── Sync cart from sessionStorage on open / on external mutations ──────────

  useEffect(() => {
    function sync() {
      const c = readCart();
      setCart(c && c.storeSlug === storeSlug ? c : null);
    }
    sync();
    window.addEventListener("cart:updated", sync);
    return () => window.removeEventListener("cart:updated", sync);
  }, [storeSlug]);

  // Keep textarea value in sync with cart when drawer opens
  useEffect(() => {
    if (isOpen && notesRef.current && cart) {
      notesRef.current.value = cart.notes ?? "";
    }
  }, [isOpen, cart]);

  // ── Lock body scroll while open ────────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleQuantityChange(
    productId: string,
    variantId: string | null,
    newQty: number,
  ) {
    const current = readCart();
    if (!current) return;
    const next = updateItemQuantity(current, productId, variantId, newQty, 1);
    if (next.items.length === 0) {
      clearCart();
      setCart(null);
      window.dispatchEvent(new Event("cart:updated"));
      onClose();
      return;
    }
    writeCart(next);
    setCart(next);
    window.dispatchEvent(new Event("cart:updated"));
  }

  function handleRemove(productId: string, variantId: string | null) {
    const current = readCart();
    if (!current) return;
    const next = removeItem(current, productId, variantId);
    if (next.items.length === 0) {
      clearCart();
      setCart(null);
      window.dispatchEvent(new Event("cart:updated"));
      onClose();
      return;
    }
    writeCart(next);
    setCart(next);
    window.dispatchEvent(new Event("cart:updated"));
  }

  function handleNotesBlur() {
    const current = readCart();
    if (!current || !notesRef.current) return;
    const next = setNotes(current, notesRef.current.value.trim() || null);
    writeCart(next);
    setCart(next);
  }

  function handleCheckout() {
    // Flush any pending notes before navigating
    const current = readCart();
    if (current && notesRef.current) {
      const next = setNotes(current, notesRef.current.value.trim() || null);
      writeCart(next);
    }

    const identified = Boolean(sessionStorage.getItem(CUSTOMER_SESSION_KEY));
    onClose();
    if (identified) {
      router.push(`/catalog/${storeSlug}/pedido/data`);
    } else {
      router.push(`/catalog/${storeSlug}/identificar`);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const items = cart?.items ?? [];
  const grandTotal = cartGrandTotal(cart);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={[
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        ].join(" ")}
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Carrinho de compras"
        className={[
          "fixed inset-x-0 bottom-0 z-50 flex flex-col",
          "rounded-t-2xl bg-white shadow-2xl",
          "transition-transform duration-300 ease-out",
          "max-h-[90dvh]",
          isOpen ? "translate-y-0" : "translate-y-full",
        ].join(" ")}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-[rgb(var(--color-border))] px-5 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <CartIcon className="h-5 w-5 text-[rgb(var(--color-text))]" />
            <h2 className="text-base font-semibold text-[rgb(var(--color-text))]">
              Seu carrinho
            </h2>
            {items.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-xs font-bold text-white">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-bg-muted))] transition-colors"
            aria-label="Fechar carrinho"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* ── Scrollable body ──────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[rgb(var(--color-bg-muted))]">
                <CartIcon className="h-7 w-7 text-[rgb(var(--color-text-muted))]" />
              </div>
              <p className="font-medium text-[rgb(var(--color-text))]">
                Carinho vazio
              </p>
              <p className="text-sm text-[rgb(var(--color-text-muted))]">
                Adicione produtos do catálogo para começar.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-0 px-5 py-4">
              {/* ── Item list ─────────────────────────────────────────────── */}
              <ul className="flex flex-col gap-3 mb-5">
                {items.map((item) => (
                  <li
                    key={`${item.productId}::${item.variantId ?? ""}`}
                    className="flex items-start gap-3 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg-muted))] p-3"
                  >
                    {/* Product info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[rgb(var(--color-text))] leading-snug">
                        {item.productName}
                      </p>
                      {item.variantLabel && (
                        <p className="mt-0.5 text-xs text-[rgb(var(--color-text-muted))]">
                          {item.variantLabel}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-[rgb(var(--color-text-muted))]">
                        {fmt(item.unitPrice)} × {item.quantity} ={" "}
                        <span className="font-semibold text-[rgb(var(--color-text))]">
                          {fmt(item.lineTotal)}
                        </span>
                      </p>
                    </div>

                    {/* Quantity stepper + remove */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label="Diminuir"
                          onClick={() =>
                            handleQuantityChange(
                              item.productId,
                              item.variantId,
                              item.quantity - 1,
                            )
                          }
                          className="flex h-6 w-6 items-center justify-center rounded border border-[rgb(var(--color-border))] text-xs font-bold text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-bg))] transition-colors"
                        >
                          −
                        </button>
                        <span className="min-w-[1.5rem] text-center text-sm font-semibold text-[rgb(var(--color-text))]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Aumentar"
                          onClick={() =>
                            handleQuantityChange(
                              item.productId,
                              item.variantId,
                              item.quantity + 1,
                            )
                          }
                          className="flex h-6 w-6 items-center justify-center rounded border border-[rgb(var(--color-border))] text-xs font-bold text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-bg))] transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleRemove(item.productId, item.variantId)
                        }
                        className="text-xs text-[rgb(var(--color-text-muted))] hover:text-red-500 transition-colors"
                      >
                        Remover
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {/* ── Notes ─────────────────────────────────────────────────── */}
              <div className="flex flex-col gap-1.5 mb-5">
                <label
                  htmlFor="cart-notes"
                  className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--color-text-muted))]"
                >
                  Observações (opcional)
                </label>
                <textarea
                  id="cart-notes"
                  ref={notesRef}
                  rows={3}
                  maxLength={500}
                  onBlur={handleNotesBlur}
                  placeholder="Ex: sem cebola, entregar no portão, caixa com laço..."
                  className={[
                    "w-full resize-none rounded-lg border border-[rgb(var(--color-border))]",
                    "bg-[rgb(var(--color-bg))] px-3 py-2.5 text-sm text-[rgb(var(--color-text))]",
                    "placeholder:text-[rgb(var(--color-text-muted))]",
                    "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))]/40",
                    "transition-colors duration-150",
                  ].join(" ")}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Footer: total + CTA ──────────────────────────────────────────── */}
        {items.length > 0 && (
          <div className="shrink-0 border-t border-[rgb(var(--color-border))] px-5 pb-[env(safe-area-inset-bottom,1rem)] pt-4 space-y-3 bg-white">
            {/* Total row */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[rgb(var(--color-text-muted))]">
                Total do pedido
              </span>
              <span className="text-lg font-bold text-[rgb(var(--color-text))] tabular-nums">
                {fmt(grandTotal)}
              </span>
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={handleCheckout}
              className={[
                "w-full rounded-xl py-3.5 text-sm font-semibold",
                "bg-foreground text-white",
                "hover:opacity-90 active:scale-[.98] transition-all duration-150",
                "mb-4",
              ].join(" ")}
            >
              Finalizar pedido →
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
