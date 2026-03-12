import Link from "next/link";
import Image from "next/image";
import type { CatalogProduct } from "@/domain/catalog/types";
import { PriceDisplay } from "./PriceDisplay";
import { PLPAddToCartButton } from "./PLPAddToCartButton";

// ─── MinQuantity badge ────────────────────────────────────────────────────────

function MinQuantityNote({ qty }: { qty: number }) {
  if (qty <= 1) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[rgb(var(--color-bg-muted))] px-2 py-0.5 text-xs text-[rgb(var(--color-text-muted))]">
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

// ─── Thumbnail ────────────────────────────────────────────────────────────────

function ProductImagePlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[rgb(var(--color-bg-muted))]">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="h-8 w-8 text-[rgb(var(--color-text-muted))] opacity-40"
        aria-hidden="true"
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
  storeSlug: string;
}

/**
 * CatalogProductCard — hybrid layout product tile.
 *
 * Mobile:   horizontal card (iFood-style) — image 96×96 left, text + CTA right.
 * Desktop:  vertical card inside CSS grid — full-width image top, body below.
 *
 * Clicking image or product name navigates to the product detail page.
 * PLPAddToCartButton handles cart logic inline (no-variant) or via sheet (with variants).
 */
export function CatalogProductCard({
  product,
  storeSlug,
}: CatalogProductCardProps) {
  const productUrl = `/catalog/${storeSlug}/${product.id}`;
  const activeVariants = product.variants.filter((v) => v.isActive);
  const hasPrice = product.price !== null || activeVariants.length > 0;

  return (
    <article
      className={[
        "flex flex-row gap-3 overflow-hidden rounded-xl p-3",
        "border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))]",
        "md:flex-col md:gap-0 md:p-0",
      ].join(" ")}
    >
      {/* ── Thumbnail ─────────────────────────────────────────────────────── */}
      <Link
        href={productUrl}
        aria-label={`Ver detalhes de ${product.name}`}
        tabIndex={-1}
        className="relative block h-24 w-24 shrink-0 overflow-hidden rounded-lg md:aspect-square md:h-auto md:w-full md:rounded-none md:rounded-t-xl"
      >
        {product.mainImageUrl ? (
          <Image
            src={product.mainImageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 96px, (max-width: 1280px) 33vw, 25vw"
            className="object-cover"
          />
        ) : (
          <ProductImagePlaceholder />
        )}
      </Link>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col gap-1 md:gap-3 md:p-4">
        {/* Name + description */}
        <div className="min-w-0 flex-1">
          <Link
            href={productUrl}
            className="group/name focus-visible:outline-none"
          >
            <h2 className="truncate text-sm font-semibold text-[rgb(var(--color-text))] group-hover/name:underline md:line-clamp-2 md:whitespace-normal">
              {product.name}
            </h2>
          </Link>
          {product.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-[rgb(var(--color-text-muted))] leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        {/* Price + cart CTA */}
        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="min-w-0">
            <PriceDisplay
              price={product.price}
              variants={activeVariants}
              selectedVariant={null}
            />
            <MinQuantityNote qty={product.minQuantity} />
          </div>

          {hasPrice && (
            <PLPAddToCartButton product={product} storeSlug={storeSlug} />
          )}
        </div>
      </div>
    </article>
  );
}
