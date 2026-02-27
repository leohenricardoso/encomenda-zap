"use client";

import { useState, useEffect, useCallback } from "react";
import type { CatalogProduct, CatalogVariant } from "@/domain/catalog/types";
import {
  readCart,
  writeCart,
  addOrUpdateItem,
  removeItem,
  cartItemKey,
} from "../_lib/cart";
import { PriceDisplay } from "./PriceDisplay";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveUnitPrice(
  product: CatalogProduct,
  variant: CatalogVariant | null,
): number | null {
  if (variant) return variant.price;
  return product.price;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface OrderProductSectionProps {
  product: CatalogProduct;
  storeSlug: string;
}

/**
 * OrderProductSection — interactive order panel on a catalog card.
 *
 * Multi-cart behaviour:
 *  - On first add → appends to cart (other items kept).
 *  - On second add of same product+variant → updates quantity.
 *  - Remove button → pulls item from cart without touching others.
 *  - Customer navigates to /pedido/revisar when already identified,
 *    or /identificar first.
 *
 * Cart state is read from sessionStorage on mount and after every mutation.
 */
export function OrderProductSection({
  product,
  storeSlug,
}: OrderProductSectionProps) {
  const activeVariants = product.variants.filter((v) => v.isActive);
  const hasVariants = activeVariants.length > 0;

  const [selectedVariant, setSelectedVariant] = useState<CatalogVariant | null>(
    null,
  );
  const [quantity, setQuantity] = useState(Math.max(product.minQuantity, 1));
  const [validationError, setValidationError] = useState<string | null>(null);
  /** Briefly true after add — drives the "✓ Adicionado!" feedback. */
  const [justAdded, setJustAdded] = useState(false);

  // How many of THIS item (product+variant) is already in the cart
  const [inCartQty, setInCartQty] = useState<number>(0);

  // Sync inCartQty from sessionStorage whenever variant changes (or on mount)
  const syncFromCart = useCallback(() => {
    const cart = readCart();
    if (!cart || cart.storeSlug !== storeSlug) {
      setInCartQty(0);
      return;
    }
    const key = cartItemKey(product.id, selectedVariant?.id ?? null);
    const existing = cart.items.find(
      (i) => cartItemKey(i.productId, i.variantId) === key,
    );
    if (existing) {
      setInCartQty(existing.quantity);
      setQuantity(existing.quantity); // keep spinner in sync
    } else {
      setInCartQty(0);
    }
  }, [product.id, selectedVariant, storeSlug]);

  useEffect(() => {
    syncFromCart();
  }, [syncFromCart]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const unitPrice = resolveUnitPrice(product, selectedVariant);
  const isInCart = inCartQty > 0;

  // ── Handlers ──────────────────────────────────────────────────────────────
  function toggleVariant(variant: CatalogVariant) {
    setSelectedVariant((prev) => (prev?.id === variant.id ? null : variant));
    setValidationError(null);
  }

  function incrementQty() {
    setQuantity((q) => q + 1);
  }

  function decrementQty() {
    setQuantity((q) => Math.max(product.minQuantity, q - 1));
  }

  function handleAddOrUpdate() {
    if (hasVariants && !selectedVariant) {
      setValidationError("Selecione uma variação antes de adicionar.");
      return;
    }
    if (unitPrice === null) {
      setValidationError("Não foi possível determinar o preço.");
      return;
    }

    const prev = readCart();
    const next = addOrUpdateItem(prev, storeSlug, {
      productId: product.id,
      variantId: selectedVariant?.id ?? null,
      productName: product.name,
      variantLabel: selectedVariant?.label ?? null,
      quantity,
      unitPrice,
    });
    writeCart(next);
    syncFromCart();

    // Notify CartFloatingBar and CartDrawer on the same page.
    window.dispatchEvent(new Event("cart:updated"));

    // Brief "Adicionado!" feedback — reverts after 1.5 s.
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  }

  function handleRemove() {
    const prev = readCart();
    if (!prev) return;
    const next = removeItem(prev, product.id, selectedVariant?.id ?? null);
    writeCart(next);
    setInCartQty(0);
    setQuantity(Math.max(product.minQuantity, 1));
    window.dispatchEvent(new Event("cart:updated"));
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">
      {/* Price display */}
      <PriceDisplay
        price={product.price}
        variants={activeVariants}
        selectedVariant={selectedVariant}
      />

      {/* In-cart badge */}
      {isInCart && (
        <div className="flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 w-fit">
          <span className="flex h-2 w-2 rounded-full bg-accent" />
          <span className="text-xs font-medium text-accent">
            {inCartQty}× no pedido
          </span>
        </div>
      )}

      {/* Variant pills */}
      {hasVariants && (
        <div
          role="group"
          aria-label="Selecione uma variação"
          className="flex flex-wrap gap-2"
        >
          {activeVariants.map((variant) => {
            const isSelected = selectedVariant?.id === variant.id;
            return (
              <button
                key={variant.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleVariant(variant)}
                className={[
                  "rounded-full border px-3 py-1 text-xs font-medium ring-focus",
                  "transition-colors duration-100",
                  isSelected
                    ? "bg-gray-200 border-2 border-black"
                    : "border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] text-[rgb(var(--color-text))]",
                ].join(" ")}
              >
                {variant.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Quantity counter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[rgb(var(--color-text-muted))]">
          Qtd.
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Diminuir quantidade"
            onClick={decrementQty}
            disabled={quantity <= product.minQuantity}
            className={[
              "flex h-6 w-6 items-center justify-center rounded border text-xs font-bold",
              "border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))]",
              "transition-colors duration-100",
              quantity <= product.minQuantity
                ? "cursor-not-allowed opacity-40"
                : "hover:bg-[rgb(var(--color-bg-muted))]",
            ].join(" ")}
          >
            −
          </button>

          <span
            aria-live="polite"
            className="min-w-[2rem] text-center text-sm font-semibold text-[rgb(var(--color-text))]"
          >
            {quantity}
          </span>

          <button
            type="button"
            aria-label="Aumentar quantidade"
            onClick={incrementQty}
            className={[
              "flex h-6 w-6 items-center justify-center rounded border text-xs font-bold",
              "border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))]",
              "transition-colors duration-100 hover:bg-[rgb(var(--color-bg-muted))]",
            ].join(" ")}
          >
            +
          </button>
        </div>
      </div>

      {/* Validation error */}
      {validationError && (
        <p role="alert" className="text-xs text-danger font-medium">
          {validationError}
        </p>
      )}

      {/* Min quantity note */}
      {product.minQuantity > 1 && (
        <p className="text-xs text-[rgb(var(--color-text-muted))]">
          Mínimo {product.minQuantity} unidades
        </p>
      )}

      {/* CTAs */}
      <div className="flex flex-col gap-2 border-t border-[rgb(var(--color-border))] pt-3">
        <button
          type="button"
          onClick={handleAddOrUpdate}
          className={[
            "w-full rounded-lg px-4 py-2 text-xs font-semibold ring-focus",
            "transition-all duration-200 active:scale-[.98]",
            justAdded
              ? "bg-green-600 text-white"
              : isInCart
                ? "bg-accent/10 text-accent hover:bg-accent/20"
                : "bg-foreground text-surface hover:bg-foreground/90",
          ].join(" ")}
        >
          {justAdded
            ? "✓ Adicionado!"
            : isInCart
              ? "Atualizar quantidade"
              : "Adicionar ao carrinho"}
        </button>

        {isInCart && (
          <button
            type="button"
            onClick={handleRemove}
            className="w-full rounded-lg px-4 py-2 text-xs font-medium ring-focus text-danger hover:bg-danger/5 transition-colors duration-150"
          >
            Remover do pedido
          </button>
        )}
      </div>
    </div>
  );
}
