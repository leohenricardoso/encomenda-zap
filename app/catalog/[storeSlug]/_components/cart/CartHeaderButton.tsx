"use client";

import { useEffect, useState } from "react";
import { readCart } from "../../_lib/cart";
import { CartDrawer } from "./CartDrawer";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CartHeaderButtonProps {
  storeSlug: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * CartHeaderButton — cart icon with badge in the CatalogHeader.
 *
 * Listens to the "cart:updated" event for real-time badge sync.
 * Renders <CartDrawer> inline (right-side panel).
 */
export function CartHeaderButton({ storeSlug }: CartHeaderButtonProps) {
  const [totalQty, setTotalQty] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    function sync() {
      const cart = readCart();
      if (cart && cart.storeSlug === storeSlug) {
        setTotalQty(cart.items.reduce((s, i) => s + i.quantity, 0));
      } else {
        setTotalQty(0);
      }
    }
    sync();
    window.addEventListener("cart:updated", sync);
    return () => window.removeEventListener("cart:updated", sync);
  }, [storeSlug]);

  return (
    <>
      {/* Fixed floating button — always visible at top-right on any scroll position */}
      <div className="fixed top-4 right-4 z-30">
        <button
          type="button"
          aria-label={
            totalQty > 0
              ? `Carrinho — ${totalQty} ${totalQty === 1 ? "item" : "itens"}`
              : "Carrinho"
          }
          onClick={() => setIsDrawerOpen(true)}
          className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[rgb(var(--color-bg))] text-[rgb(var(--color-text))] shadow-lg ring-1 ring-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-bg-muted))] active:scale-95 transition-all cursor-pointer"
        >
          <CartIcon className="h-5 w-5" />
          {totalQty > 0 && (
            <span
              aria-hidden="true"
              className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold text-white shadow-sm"
            >
              {totalQty > 99 ? "99+" : totalQty}
            </span>
          )}
        </button>
      </div>

      <CartDrawer
        storeSlug={storeSlug}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
}

// ─── Icon ─────────────────────────────────────────────────────────────────────

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
