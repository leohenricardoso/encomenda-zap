"use client";

import Link from "next/link";
import type { CatalogProduct } from "@/domain/catalog/types";
import { ProductDetailImageGallery } from "./ProductDetailImageGallery";
import { OrderProductSection } from "./OrderProductSection";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductDetailClientProps {
  product: CatalogProduct;
  storeSlug: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ProductDetailClient — interactive product detail view for the catalog.
 *
 * Layout:
 *   Mobile  : stacked (image → info → order section)
 *   Desktop : two-column grid (image left, info+order right)
 *
 * Cart logic is intentionally delegated to OrderProductSection — the same
 * component used on the catalog card — to avoid duplicating logic.
 */
export function ProductDetailClient({
  product,
  storeSlug,
}: ProductDetailClientProps) {
  return (
    <div className="space-y-6">
      {/* ── Back link ────────────────────────────────────────────────────── */}
      <Link
        href={`/catalog/${storeSlug}`}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-bg-muted))] transition-all duration-150 -ml-3"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
            clipRule="evenodd"
          />
        </svg>
        Voltar para produtos
      </Link>

      {/* ── Product layout ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-12">
        {/* ── Left: image gallery ───────────────────────────────────────── */}
        <ProductDetailImageGallery
          images={product.images}
          productName={product.name}
        />

        {/* ── Right: info + order section ───────────────────────────────── */}
        <div className="flex flex-col gap-6">
          {/* Product identity */}
          <div className="space-y-3">
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-[rgb(var(--color-text))] sm:text-3xl">
              {product.name}
            </h1>
            {product.description && (
              <p className="text-base leading-relaxed text-[rgb(var(--color-text-muted))]">
                {product.description}
              </p>
            )}
          </div>

          {/* Divider */}
          <hr className="border-[rgb(var(--color-border))]" />

          {/* Pricing / variants / qty / CTA */}
          <OrderProductSection product={product} storeSlug={storeSlug} />
        </div>
      </div>
    </div>
  );
}
