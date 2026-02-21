import type { CatalogProduct } from "@/domain/catalog/types";
import { PriceDisplay } from "./PriceDisplay";
import { VariationSelector } from "./VariationSelector";

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

// ─── Image placeholder ────────────────────────────────────────────────────────

function ImagePlaceholder() {
  return (
    <div
      aria-hidden="true"
      className="flex h-full w-full items-center justify-center bg-[rgb(var(--color-bg-muted))]"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1}
        stroke="currentColor"
        className="h-10 w-10 text-[rgb(var(--color-border))]"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
        />
      </svg>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CatalogProductCardProps {
  product: CatalogProduct;
}

/**
 * CatalogProductCard — public-facing product tile.
 *
 * Server Component by default. Delegates variant interaction to
 * VariationSelector (Client Component) when variants exist.
 *
 * Future: accept `onOrder` callback or wrap with an order modal trigger.
 */
export function CatalogProductCard({ product }: CatalogProductCardProps) {
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
      {/* ── Image / placeholder ───────────────────────────────────────── */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <ImagePlaceholder />
      </div>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Product name + description */}
        <div className="flex-1">
          <h2
            className="text-sm font-semibold text-[rgb(var(--color-text))] leading-snug"
            title={product.name}
          >
            {product.name}
          </h2>

          {product.description && (
            <p className="mt-1 line-clamp-2 text-xs text-[rgb(var(--color-text-muted))] leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        {/* Price + variants */}
        <div className="mt-auto flex flex-col gap-2">
          {hasVariants ? (
            // Client Component: holds variant selection state
            <VariationSelector
              variants={product.variants}
              basePrice={product.price}
            />
          ) : (
            // Simple product — static, no interactivity needed
            <PriceDisplay price={product.price} variants={[]} />
          )}

          {/* Min quantity note */}
          <MinQuantityNote qty={product.minQuantity} />
        </div>

        {/* ── Order CTA (placeholder for future "Encomendar" button) ──── */}
        <div className="border-t border-[rgb(var(--color-border))] pt-3">
          <button
            type="button"
            disabled
            aria-label={`Encomendar ${product.name} (em breve)`}
            className={[
              "w-full rounded-lg border border-[rgb(var(--color-border))]",
              "px-4 py-2 text-xs font-medium",
              "text-[rgb(var(--color-text-muted))]",
              "cursor-not-allowed opacity-50",
            ].join(" ")}
          >
            Encomendar em breve
          </button>
        </div>
      </div>
    </article>
  );
}
