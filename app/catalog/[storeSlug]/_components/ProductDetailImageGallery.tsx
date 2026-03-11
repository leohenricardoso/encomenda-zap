"use client";

import { useState } from "react";
import Image from "next/image";
import type { CatalogImage } from "@/domain/catalog/types";
import { ImagePlaceholder } from "./ImageGallery";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProductDetailImageGalleryProps {
  images: CatalogImage[];
  productName: string;
}

const DETAIL_SIZES = "(max-width: 1023px) 100vw, 50vw";

// ─── Component ──────────────────────────────────────────────────────────────────

/**
 * ProductDetailImageGallery — full-size image gallery for the product detail page.
 *
 * Uses next/image for responsive, optimised delivery.
 * - No images → ImagePlaceholder
 * - 1 image   → single prominent image
 * - 2–3 images → large main image + clickable thumbnail strip below
 */
export function ProductDetailImageGallery({
  images,
  productName,
}: ProductDetailImageGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);

  // ── No images ─────────────────────────────────────────────────────────
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
      {/* ── Main image ────────────────────────────────────────────────── */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))]">
        <Image
          key={active.id}
          src={active.imageUrl}
          alt={productName}
          fill
          sizes={DETAIL_SIZES}
          className="object-cover transition-opacity duration-200"
          priority
        />
      </div>

      {/* ── Thumbnail strip (only when 2+ images) ─────────────────────── */}
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
                  "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer",
                  isActive
                    ? "border-foreground ring-1 ring-foreground"
                    : "border-transparent opacity-55 hover:opacity-90",
                ].join(" ")}
              >
                <Image
                  src={img.imageUrl}
                  alt={`Miniatura ${idx + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
