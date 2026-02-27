"use client";

import { useState, useEffect } from "react";
import { readCart, cartTotalQty, cartGrandTotal } from "../_lib/cart";
import { CartDrawer } from "./CartDrawer";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ─── Component ────────────────────────────────────────────────────────────────

interface CartFloatingBarProps {
  storeSlug: string;
}

/**
 * CartFloatingBar — sticky bottom action bar for the catalog page.
 *
 * Reads the cart and customer session from sessionStorage on mount and
 * whenever sessionStorage changes (cross-tab via a custom event dispatched
 * by cart mutators).
 *
 * Design decisions:
 *  - Renders nothing when the cart is empty (no layout shift).
 *  - Uses subtle slide-up animation so it doesn't startle the user.
 *  - On "Ver pedido": if customer already identified → go to /pedido/revisar,
 *    otherwise → /identificar.
 */
export function CartFloatingBar({ storeSlug }: CartFloatingBarProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [totalQty, setTotalQty] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [visible, setVisible] = useState(false);

  // Hydrate from sessionStorage and listen for changes
  useEffect(() => {
    function sync() {
      const cart = readCart();
      if (!cart || cart.storeSlug !== storeSlug || cart.items.length === 0) {
        setTotalQty(0);
        setGrandTotal(0);
        setVisible(false);
        return;
      }
      setTotalQty(cartTotalQty(cart));
      setGrandTotal(cartGrandTotal(cart));
      setVisible(true);
    }

    sync();

    // Listen for custom events dispatched after cart mutations
    window.addEventListener("cart:updated", sync);
    // Also re-sync on storage events (other tabs)
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("cart:updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, [storeSlug]);

  // Poll for changes from OrderProductSection on same page (same tab, so
  // the "storage" event won't fire). A short interval is the simplest
  // approach until we move to a shared React context.
  useEffect(() => {
    const id = setInterval(() => {
      const cart = readCart();
      const qty = cartTotalQty(
        cart && cart.storeSlug === storeSlug ? cart : null,
      );
      const total = cartGrandTotal(
        cart && cart.storeSlug === storeSlug ? cart : null,
      );

      setTotalQty((prev) => {
        if (prev !== qty) {
          setVisible(qty > 0);
          return qty;
        }
        return prev;
      });
      setGrandTotal(total);
    }, 400);
    return () => clearInterval(id);
  }, [storeSlug]);

  if (!visible) return null;

  return (
    <>
      <div
        role="region"
        aria-label="Resumo do pedido"
        className={[
          // Fixed bottom bar — sits above the fold on mobile
          "fixed bottom-0 left-0 right-0 z-50",
          "animate-in slide-in-from-bottom duration-300",
          // Visual chrome
          "border-t border-line bg-surface/95 backdrop-blur-sm shadow-lg",
          "px-4 py-3 sm:px-6",
        ].join(" ")}
      >
        <div className="mx-auto flex max-w-screen-xl items-center justify-between gap-4">
          {/* Cart summary */}
          <div className="flex items-center gap-3">
            {/* Cart icon with badge */}
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-foreground"
                aria-hidden="true"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {totalQty > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white leading-none">
                  {totalQty}
                </span>
              )}
            </div>

            <div className="flex flex-col">
              <span className="text-[11px] text-foreground-muted leading-none">
                {totalQty} {totalQty === 1 ? "item" : "itens"}
              </span>
              <span className="text-sm font-bold text-foreground tabular-nums">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className={[
              "rounded-xl px-5 py-2.5 text-sm font-semibold",
              "bg-foreground text-surface",
              "transition-colors duration-150 hover:bg-foreground/90 active:scale-[.98]",
              "ring-focus shrink-0",
            ].join(" ")}
          >
            Ver carrinho
          </button>
        </div>
      </div>

      <CartDrawer
        storeSlug={storeSlug}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
}
