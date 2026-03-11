"use client";

import { useState } from "react";
import Image from "next/image";
import type { CatalogImage } from "@/domain/catalog/types";

// ─── Placeholder ─────────────────────────────────────────────────────

/**
 * Shown when a product has no images.
 * Maintains consistent card dimensions so the grid never collapses.
 */
export function ImagePlaceholder() {
  return (
    <div
      aria-hidden="true"
      className="aspect-[4/3] flex w-full items-center justify-center bg-[rgb(var(--color-bg-muted))]"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1}
        stroke="currentColor"
        className="h-10 w-10 text-[rgb(var(--color-border))]"
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

// ─── Types ───────────────────────────────────────────────────────────────────

interface ImageGalleryProps {
  images: CatalogImage[];
  productName: string;
}

// Responsive sizes hint for the 1/2/3/4-col grid on the catalog page.
const CARD_SIZES =
  "(max-width: 639px) 100vw, (max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw";

// ─── Component ──────────────────────────────────────────────────────────────────

/**
 * ImageGallery — displays product images on a catalog card.
 *
 * Uses next/image for automatic WebP/AVIF conversion, responsive srcsets,
 * and lazy loading. No external configuration needed beyond remotePatterns.
 *
 * Behaviours:
 *   - No images → ImagePlaceholder (consistent card height)
 *   - 1 image   → single optimised image, subtle zoom on card hover
 *   - 2–3 imgs  → Mobile: CSS snap-scroll carousel · Desktop: main + thumbs
 */
export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);

  // ── No images ─────────────────────────────────────────────────────────
  if (images.length === 0) {
    return <ImagePlaceholder />;
  }

  // ── Single image ────────────────────────────────────────────────────
  if (images.length === 1) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={images[0].imageUrl}
          alt={productName}
          fill
          sizes={CARD_SIZES}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          priority={false}
        />
      </div>
    );
  }

  // ── Multiple images ──────────────────────────────────────────────────
  return (
    <>
      {/* ════════════════════════════════════════════════════════════════
          MOBILE — horizontal snap-scroll carousel (pure CSS, zero JS)
      ════════════════════════════════════════════════════════════════ */}
      <div className="relative md:hidden">
        <div
          className="flex overflow-x-auto snap-x snap-mandatory"
          style={{ scrollbarWidth: "none" }}
        >
          {images.map((img, i) => (
            <div
              key={img.id}
              className="relative aspect-[4/3] w-full shrink-0 snap-start snap-always overflow-hidden"
            >
              <Image
                src={img.imageUrl}
                alt={`${productName} — imagem ${i + 1}`}
                fill
                sizes="100vw"
                className="object-cover"
                priority={i === 0}
              />
            </div>
          ))}
        </div>

        {/* Dot indicators */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-2 left-0 right-0 flex justify-center gap-1.5"
        >
          {images.map((_, i) => (
            <span
              key={i}
              className="block h-1.5 w-1.5 rounded-full bg-white shadow"
            />
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          DESKTOP — main image + clickable thumbnail strip
      ════════════════════════════════════════════════════════════════ */}
      <div className="hidden md:flex md:flex-col">
        {/* Main image */}
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image
            src={images[activeIdx].imageUrl}
            alt={`${productName} — imagem ${activeIdx + 1}`}
            fill
            sizes={CARD_SIZES}
            className="object-cover transition-opacity duration-150 group-hover:scale-105 transition-transform duration-300"
            priority={activeIdx === 0}
          />
        </div>

        {/* Thumbnail strip */}
        <div className="flex gap-1.5 bg-[rgb(var(--color-bg-muted))] px-2 py-2">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              aria-label={`Exibir imagem ${i + 1} de ${productName}`}
              aria-pressed={i === activeIdx}
              onClick={() => setActiveIdx(i)}
              className={[
                "relative h-12 w-12 shrink-0 overflow-hidden rounded transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
                "focus-visible:ring-[rgb(var(--color-primary))]",
                i === activeIdx
                  ? "ring-2 ring-[rgb(var(--color-primary))] opacity-100"
                  : "opacity-55 hover:opacity-90",
              ].join(" ")}
            >
              <Image
                src={img.imageUrl}
                alt=""
                aria-hidden="true"
                fill
                sizes="48px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
