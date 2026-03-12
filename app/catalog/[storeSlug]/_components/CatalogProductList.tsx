import type { CatalogProduct } from "@/domain/catalog/types";
import { CatalogProductCard } from "./CatalogProductCard";
import { CatalogEmptyState } from "./CatalogEmptyState";

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  products: CatalogProduct[];
  storeSlug: string;
  emptyMessage?: string;
}

/**
 * CatalogProductList — responsive product grid / list layout.
 *
 * Mobile:   vertical stack of horizontal cards (iFood-style).
 * Desktop:  3-column grid, 4-column on large screens (vertical cards).
 */
export function CatalogProductList({
  products,
  storeSlug,
  emptyMessage,
}: Props) {
  if (products.length === 0) {
    return <CatalogEmptyState message={emptyMessage} />;
  }

  return (
    <div className="flex flex-col gap-2 md:grid md:grid-cols-3 md:gap-4 lg:grid-cols-4">
      {products.map((product) => (
        <CatalogProductCard
          key={product.id}
          product={product}
          storeSlug={storeSlug}
        />
      ))}
    </div>
  );
}
