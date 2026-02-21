"use client";

import { useState } from "react";
import type { CatalogVariant } from "@/domain/catalog/types";
import { PriceDisplay } from "./PriceDisplay";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VariationSelectorProps {
  variants: CatalogVariant[];
  /** Fixed product price (null = variant-priced) */
  basePrice: number | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * VariationSelector — client-side interactive variant picker.
 *
 * Encapsulates selection state so parent components stay as Server Components.
 * Renders pill buttons for each active variant and updates the price display.
 *
 * Future extension: expose `onVariantChange(variant)` callback to pass the
 * selected variant up to a cart / order context without lifting state here.
 */
export function VariationSelector({
  variants,
  basePrice,
}: VariationSelectorProps) {
  const activeVariants = variants.filter((v) => v.isActive);
  const [selected, setSelected] = useState<CatalogVariant | null>(null);

  // Simple product with no (or zero active) variants — just show price
  if (activeVariants.length === 0) {
    return (
      <PriceDisplay price={basePrice} variants={[]} selectedVariant={null} />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ── Price ─────────────────────────────────────────────────────── */}
      <PriceDisplay
        price={basePrice}
        variants={activeVariants}
        selectedVariant={selected}
      />

      {/* ── Variant pills ─────────────────────────────────────────────── */}
      <div
        role="group"
        aria-label="Selecione uma variação"
        className="flex flex-wrap gap-2"
      >
        {activeVariants.map((variant) => {
          const isSelected = selected?.id === variant.id;
          return (
            <button
              key={variant.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelected(isSelected ? null : variant)}
              className={[
                "rounded-full border px-3 py-1 text-xs font-medium",
                "transition-colors duration-100 ring-focus",
                isSelected
                  ? "border-accent bg-accent text-white"
                  : "border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))]",
                "text-[rgb(var(--color-text))]",
                isSelected ? "text-white" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {variant.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
