/**
 * ProductCard — visual tile in the products grid.
 *
 * Purely presentational: receives all data as props, raises no business events.
 * Actions (edit, toggle, delete) are rendered as child components so each
 * manages its own loading state independently.
 *
 * No imageUrl on the domain Product yet — a placeholder is rendered instead.
 * When images are added (Sprint: upload), pass imageUrl?: string here.
 */

import Link from "next/link";
import { Badge } from "./Badge";
import ToggleActiveButton from "./ToggleActiveButton";
import { DeleteProductButton } from "./DeleteProductButton";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductCardProps {
  id: string;
  name: string;
  /** null when product uses variant pricing */
  price: number | null;
  /** Number of variants; shown only when price is null */
  variantCount?: number;
  isActive: boolean;
  /** Optional; placeholder shown when absent */
  imageUrl?: string | null;
}

// ─── Price formatter ──────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
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

export function ProductCard({
  id,
  name,
  price,
  variantCount,
  isActive,
  imageUrl,
}: ProductCardProps) {
  return (
    <article
      className={[
        "group flex flex-col overflow-hidden rounded-xl",
        "border border-[rgb(var(--color-border))]",
        "bg-[rgb(var(--color-bg))]",
        "transition-shadow duration-150 hover:shadow-md",
      ].join(" ")}
    >
      {/* ── Product image / placeholder ─────────────────────────────────── */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <ImagePlaceholder />
        )}

        {/* Status badge — positioned over image */}
        <div className="absolute left-3 top-3">
          <Badge variant={isActive ? "active" : "inactive"} />
        </div>
      </div>

      {/* ── Card body ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Product info */}
        <div className="flex-1">
          <h3
            className="truncate text-sm font-semibold text-[rgb(var(--color-text))]"
            title={name}
          >
            {name}
          </h3>
          <p className="mt-0.5 text-base font-medium text-[rgb(var(--color-text))]">
            {price !== null
              ? formatPrice(price)
              : `${variantCount ?? 0} varia${(variantCount ?? 0) !== 1 ? "ções" : "ção"}`}
          </p>
        </div>

        {/* ── Actions row ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 border-t border-[rgb(var(--color-border))] pt-3">
          {/* Edit */}
          <Link
            href={`/dashboard/products/${id}/edit`}
            className={[
              "flex-1 rounded-lg border border-[rgb(var(--color-border))]",
              "px-3 py-1.5 text-center text-xs font-medium",
              "text-[rgb(var(--color-text))]",
              "transition-colors hover:bg-[rgb(var(--color-bg-muted))]",
              "ring-focus",
            ].join(" ")}
          >
            Editar
          </Link>

          {/* Toggle active/inactive */}
          <ToggleActiveButton productId={id} isActive={isActive} />

          {/* Delete */}
          <DeleteProductButton productId={id} productName={name} />
        </div>
      </div>
    </article>
  );
}
