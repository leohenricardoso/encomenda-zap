import Link from "next/link";
import type { CatalogProduct } from "@/domain/catalog/types";
import { ImageGallery } from "./ImageGallery";
import { PriceDisplay } from "./PriceDisplay";
import { OrderProductSection } from "./OrderProductSection";

// ─── MinQuantity badge ────────────────────────────────────────────────────────

function MinQuantityNote({ qty }: { qty: number }) {
  if (qty <= 1) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[rgb(var(--color-bg-muted))] px-2 py-0.5 text-xs text-[rgb(var(--color-text-muted))]">
      {/* Small info icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        className="h-3 w-3 shrink-0"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0Zm-6 3.5a1 1 0 1 1-2 0v-3a1 1 0 1 1 2 0v3ZM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"
          clipRule="evenodd"
        />
      </svg>
      Mínimo {qty} {qty === 1 ? "unidade" : "unidades"}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CatalogProductCardProps {
  product: CatalogProduct;
  storeSlug: string;
}

/**
 * CatalogProductCard — public-facing product tile.
 *
 * Server Component by default. Delegates variant interaction to
 * VariationSelector (Client Component) when variants exist.
 *
 * Future: accept `onOrder` callback or wrap with an order modal trigger.
 */
export function CatalogProductCard({
  product,
  storeSlug,
}: CatalogProductCardProps) {
  const hasVariants = product.variants.length > 0;

  return (
    <article
      className={[
        "group flex flex-col overflow-hidden rounded-xl",
        "border border-[rgb(var(--color-border))]",
        "bg-[rgb(var(--color-bg))]",
        "transition-shadow duration-150 hover:shadow-md",
      ].join(" ")}
    >
      {/* ── Image gallery / placeholder ───────────────────────────────── */}
      <Link
        href={`/catalog/${storeSlug}/${product.id}`}
        aria-label={`Ver detalhes de ${product.name}`}
        className="block overflow-hidden"
        tabIndex={-1}
      >
        <ImageGallery images={product.images} productName={product.name} />
      </Link>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Product name + description */}
        <div className="flex-1">
          <Link
            href={`/catalog/${storeSlug}/${product.id}`}
            className="group/name focus-visible:outline-none"
          >
            <h2
              className="text-sm font-semibold text-[rgb(var(--color-text))] leading-snug group-hover/name:underline"
              title={product.name}
            >
              {product.name}
            </h2>
          </Link>

          {product.description && (
            <p className="mt-1 line-clamp-2 text-xs text-[rgb(var(--color-text-muted))] leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        {/* Price + variants + order CTA */}
        <div className="mt-auto">
          {hasVariants || product.price !== null ? (
            // Client Component: handles variant selection, qty, and ordering
            <OrderProductSection product={product} storeSlug={storeSlug} />
          ) : (
            // Fallback for products with no price info
            <PriceDisplay price={product.price} variants={[]} />
          )}
        </div>
      </div>
    </article>
  );
}
