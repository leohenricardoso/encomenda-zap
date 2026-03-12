"use client";

import { useState, useEffect, useCallback } from "react";
import type { CatalogProduct } from "@/domain/catalog/types";
import {
  readCart,
  writeCart,
  addOrUpdateItem,
  cartItemKey,
} from "../_lib/cart";
import { ProductVariantSheet } from "./ProductVariantSheet";

// ─── Types ────────────────────────────────────────────────────────────────────

type AddState = "idle" | "adding" | "added";

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  product: CatalogProduct;
  storeSlug: string;
}

/**
 * PLPAddToCartButton — add-to-cart control for the product listing page.
 *
 * Products WITHOUT variants:
 *   – Shows an "Adicionar" button. Click cycles through Adicionando… → Adicionado! → Adicionar.
 *   – Always returns to idle state after 1 s (no persistent stepper).
 *
 * Products WITH variants:
 *   – Renders a "+" button that opens ProductVariantSheet (bottom drawer).
 *   – Shows a badge with total qty in cart across all variants.
 */
export function PLPAddToCartButton({ product, storeSlug }: Props) {
  const activeVariants = product.variants.filter((v) => v.isActive);
  const hasVariants = activeVariants.length > 0;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [addState, setAddState] = useState<AddState>("idle");
  /** Total quantity in cart for this product (across all variants). */
  const [inCartQty, setInCartQty] = useState(0);

  const syncFromCart = useCallback(() => {
    const cart = readCart();
    if (!cart || cart.storeSlug !== storeSlug) {
      setInCartQty(0);
      return;
    }
    if (hasVariants) {
      const total = cart.items
        .filter((i) => i.productId === product.id)
        .reduce((sum, i) => sum + i.quantity, 0);
      setInCartQty(total);
    } else {
      const key = cartItemKey(product.id, null);
      const existing = cart.items.find(
        (i) => cartItemKey(i.productId, i.variantId) === key,
      );
      setInCartQty(existing?.quantity ?? 0);
    }
  }, [product.id, storeSlug, hasVariants]);

  useEffect(() => {
    syncFromCart();
    window.addEventListener("cart:updated", syncFromCart);
    return () => window.removeEventListener("cart:updated", syncFromCart);
  }, [syncFromCart]);

  // ── With variants — opens bottom sheet ─────────────────────────────────────
  if (hasVariants) {
    return (
      <>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-label={`Adicionar ${product.name} ao carrinho`}
          className={[
            "min-h-[36px] rounded-xl px-3 py-1.5 text-xs font-semibold shrink-0",
            "ring-focus cursor-pointer transition-all duration-200 active:scale-[.97]",
            "bg-foreground text-surface hover:bg-foreground/90",
          ].join(" ")}
        >
          Adicionar
        </button>

        {sheetOpen && (
          <ProductVariantSheet
            product={product}
            storeSlug={storeSlug}
            onClose={() => setSheetOpen(false)}
          />
        )}
      </>
    );
  }

  // ── Without variants — needs a fixed price ─────────────────────────────────
  if (product.price === null) return null;
  const unitPrice = product.price;
  const minQty = Math.max(product.minQuantity, 1);

  function handleAdd() {
    if (addState !== "idle") return;
    setAddState("adding");
    const prev = readCart();
    const next = addOrUpdateItem(prev, storeSlug, {
      productId: product.id,
      variantId: null,
      productName: product.name,
      variantLabel: null,
      quantity: minQty,
      unitPrice,
    });
    writeCart(next);
    syncFromCart();
    window.dispatchEvent(new Event("cart:updated"));
    setAddState("added");
    setTimeout(() => setAddState("idle"), 1000);
  }

  const isAdding = addState === "adding";
  const isAdded = addState === "added";

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={isAdding}
      aria-label={`Adicionar ${product.name} ao carrinho`}
      className={[
        "min-h-[36px] rounded-xl px-3 py-1.5 text-xs font-semibold shrink-0",
        "ring-focus cursor-pointer transition-all duration-200 active:scale-[.97]",
        isAdded
          ? "bg-green-600 text-white"
          : isAdding
            ? "bg-foreground/60 text-surface cursor-not-allowed"
            : "bg-foreground text-surface hover:bg-foreground/90",
      ].join(" ")}
    >
      {isAdded ? "✓ Adicionado!" : isAdding ? "Adicionando…" : "Adicionar"}
    </button>
  );
}
