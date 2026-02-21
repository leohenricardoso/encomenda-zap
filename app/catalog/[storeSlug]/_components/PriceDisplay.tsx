import type { CatalogVariant } from "@/domain/catalog/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PriceDisplayProps {
  /** Fixed price for simple products. Null → variant-priced. */
  price: number | null;
  /** Active variants; required when price is null */
  variants?: CatalogVariant[];
  /** Currently selected variant (controlled by parent) */
  selectedVariant?: CatalogVariant | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * PriceDisplay — renders product pricing in a consistent, customer-friendly way.
 *
 * Logic:
 *   - Simple product (price ≠ null): show fixed price + pricingType suffix
 *   - Variant-priced, variant selected: show variant price + suffix
 *   - Variant-priced, no selection: show "a partir de R$ X,XX" (lowest active variant)
 */
export function PriceDisplay({
  price,
  variants = [],
  selectedVariant,
}: PriceDisplayProps) {
  // ── Simple product ──────────────────────────────────────────────────────────
  if (price !== null) {
    return (
      <span className="text-lg font-semibold text-[rgb(var(--color-text))]">
        {formatCurrency(price)}
      </span>
    );
  }

  // ── Variant selected ────────────────────────────────────────────────────────
  if (selectedVariant) {
    return (
      <span className="text-lg font-semibold text-[rgb(var(--color-text))]">
        {formatCurrency(selectedVariant.price)}
        {selectedVariant.pricingType === "WEIGHT" && (
          <span className="ml-1 text-sm font-normal text-[rgb(var(--color-text-muted))]">
            /kg
          </span>
        )}
      </span>
    );
  }

  // ── No selection yet — show lowest active variant price ─────────────────────
  const activeVariants = variants.filter((v) => v.isActive);
  if (activeVariants.length === 0) {
    return (
      <span className="text-sm text-[rgb(var(--color-text-muted))]">
        Consulte valores
      </span>
    );
  }

  const lowestPrice = Math.min(...activeVariants.map((v) => v.price));

  return (
    <span className="text-lg font-semibold text-[rgb(var(--color-text))]">
      <span className="mr-1 text-sm font-normal text-[rgb(var(--color-text-muted))]">
        a partir de
      </span>
      {formatCurrency(lowestPrice)}
    </span>
  );
}
