"use client";

import { useEffect } from "react";
import type { CatalogProduct } from "@/domain/catalog/types";
import { OrderProductSection } from "./OrderProductSection";

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  product: CatalogProduct;
  storeSlug: string;
  onClose(): void;
}

/**
 * ProductVariantSheet — bottom drawer for variant selection + add-to-cart.
 *
 * Rendered only when open (parent controls mounting).
 * Reuses OrderProductSection so all cart logic lives in one place.
 * Does NOT auto-close on cart:updated — user closes when done.
 */
export function ProductVariantSheet({ product, storeSlug, onClose }: Props) {
  // Lock body scroll while sheet is visible
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="relative mx-auto w-full max-w-lg rounded-t-2xl bg-[rgb(var(--color-bg))] px-4 pt-4 pb-10 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={`Selecione opções para ${product.name}`}
      >
        {/* Drag handle */}
        <div className="mb-3 flex justify-center">
          <div className="h-1 w-10 rounded-full bg-[rgb(var(--color-border))]" />
        </div>

        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[rgb(var(--color-text))] leading-snug">
              {product.name}
            </h2>
            {product.description && (
              <p className="mt-0.5 line-clamp-2 text-xs text-[rgb(var(--color-text-muted))]">
                {product.description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xl text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-bg-muted))] transition-colors cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Full cart interaction — all variant + quantity + CTA logic */}
        <OrderProductSection product={product} storeSlug={storeSlug} />
      </div>
    </div>
  );
}
