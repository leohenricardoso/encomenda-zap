"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CatalogProduct, CatalogVariant } from "@/domain/catalog/types";
import { writeCart } from "../_lib/cart";
import { CUSTOMER_SESSION_KEY } from "../identificar/_components/CustomerIdentityForm";
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
 * OrderProductSection — interactive order entry on a catalog card.
 *
 * Handles:
 *  - Variant pill selection
 *  - Quantity counter (respects minQuantity)
 *  - "Encomendar" CTA → writes cart to sessionStorage and navigates to
 *    /identificar (or /pedido/revisar when the customer is already identified)
 */
export function OrderProductSection({
  product,
  storeSlug,
}: OrderProductSectionProps) {
  const router = useRouter();
  const activeVariants = product.variants.filter((v) => v.isActive);
  const hasVariants = activeVariants.length > 0;

  const [selectedVariant, setSelectedVariant] = useState<CatalogVariant | null>(
    null,
  );
  const [quantity, setQuantity] = useState(Math.max(product.minQuantity, 1));
  const [validationError, setValidationError] = useState<string | null>(null);

  // ── Derived state ──────────────────────────────────────────────────────────
  const unitPrice = resolveUnitPrice(product, selectedVariant);

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

  function handleOrder() {
    // Validate variant selection when required
    if (hasVariants && !selectedVariant) {
      setValidationError("Selecione uma variação antes de encomendar.");
      return;
    }
    if (unitPrice === null) {
      setValidationError("Não foi possível determinar o preço.");
      return;
    }

    // Build cart session (single-item replace strategy)
    writeCart({
      storeSlug,
      items: [
        {
          productId: product.id,
          variantId: selectedVariant?.id ?? null,
          productName: product.name,
          variantLabel: selectedVariant?.label ?? null,
          quantity,
          unitPrice,
          lineTotal: unitPrice * quantity,
        },
      ],
      shippingAddress: null,
    });

    // Navigate — skip identificar when the customer is already known
    const alreadyIdentified = Boolean(
      sessionStorage.getItem(CUSTOMER_SESSION_KEY),
    );
    if (alreadyIdentified) {
      router.push(`/catalog/${storeSlug}/pedido/revisar`);
    } else {
      router.push(`/catalog/${storeSlug}/identificar`);
    }
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
                    ? "border-accent bg-accent text-white"
                    : "border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] text-[rgb(var(--color-text))]",
                ]
                  .filter(Boolean)
                  .join(" ")}
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
          Mínimo {product.minQuantity}{" "}
          {product.minQuantity === 1 ? "unidade" : "unidades"}
        </p>
      )}

      {/* Order CTA */}
      <button
        type="button"
        onClick={handleOrder}
        className={[
          "w-full rounded-lg px-4 py-2 text-xs font-semibold",
          "bg-foreground text-surface",
          "transition-colors duration-150 hover:bg-foreground/90 active:scale-[.98]",
          "ring-focus",
        ].join(" ")}
      >
        Encomendar
      </button>
    </div>
  );
}
