"use client";

import { useState } from "react";
import type { CatalogImage } from "@/domain/catalog/types";
import { ImagePlaceholder } from "./ImageGallery";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductDetailImageGalleryProps {
  images: CatalogImage[];
  productName: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ProductDetailImageGallery — full-size image display for the product detail page.
 *
 * Behaviours:
 *   - No images  → ImagePlaceholder
 *   - 1 image    → single large image, no thumbnails
 *   - 2–3 images → large main image + clickable thumbnail strip below
 *
 * Designed to fill its grid column; parent controls the outer width.
 */
export function ProductDetailImageGallery({
  images,
  productName,
}: ProductDetailImageGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);

  // ── No images ──────────────────────────────────────────────────────────────
  if (images.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))]">
        <ImagePlaceholder />
      </div>
    );
  }

  const active = images[activeIdx] ?? images[0];

  return (
    <div className="flex flex-col gap-3">
      {/* ── Main image ──────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={active.imageUrl}
          src={active.imageUrl}
          alt={productName}
          loading="eager"
          width={800}
          height={600}
          className="aspect-[4/3] w-full object-cover transition-opacity duration-200"
        />
      </div>

      {/* ── Thumbnail strip (only when 2+ images) ───────────────────────────── */}
      {images.length > 1 && (
        <div
          role="list"
          aria-label="Miniaturas do produto"
          className="flex gap-2"
        >
          {images.map((img, idx) => {
            const isActive = idx === activeIdx;
            return (
              <button
                key={img.id}
                type="button"
                role="listitem"
                aria-label={`Ver imagem ${idx + 1}`}
                aria-current={isActive}
                onClick={() => setActiveIdx(idx)}
                className={[
                  "h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  isActive
                    ? "border-foreground ring-1 ring-foreground"
                    : "border-transparent opacity-60 hover:opacity-90",
                ].join(" ")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.imageUrl}
                  alt={`Miniatura ${idx + 1}`}
                  loading="lazy"
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
