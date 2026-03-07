"use client";

import { useState } from "react";
import type { CatalogImage } from "@/domain/catalog/types";

// ─── Placeholder ─────────────────────────────────────────────────────────────

/**
 * Shown when a product has no images at all.
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImageGalleryProps {
  images: CatalogImage[];
  productName: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ImageGallery — displays product images in the public catalog card.
 *
 * Behaviours:
 *   - No images → ImagePlaceholder (consistent card dimensions).
 *   - 1 image   → plain <img> (no unnecessary UI chrome).
 *   - 2–3 imgs  → Desktop: main image + clickable thumbnail strip.
 *                 Mobile : horizontal snap-scroll carousel (zero JS, pure CSS).
 *
 * Performance:
 *   - First image loads eagerly; all extras load lazily.
 *   - No external libraries — CSS scroll snap handles mobile swipe natively.
 */
export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);

  // ── No images ──────────────────────────────────────────────────────────────
  if (images.length === 0) {
    return <ImagePlaceholder />;
  }

  // ── Single image ───────────────────────────────────────────────────────────
  if (images.length === 1) {
    return (
      <div className="aspect-[4/3] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[0].imageUrl}
          alt={productName}
          loading="lazy"
          width={400}
          height={300}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  // ── Multiple images ────────────────────────────────────────────────────────
  return (
    <>
      {/* ════════════════════════════════════════════════════════════════
          MOBILE — horizontal snap-scroll carousel
          Entirely CSS-driven: no touch handlers needed.
          Swipe left/right navigates between images.
      ══════════════════════════════════════════════════════════════════ */}
      <div
        className="relative md:hidden"
        aria-label={`Imagens de ${productName}`}
      >
        {/* Scrollable strip */}
        <div
          className="flex overflow-x-auto snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        >
          {images.map((img, i) => (
            <div
              key={img.id}
              className="aspect-[4/3] w-full shrink-0 snap-start snap-always overflow-hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.imageUrl}
                alt={`${productName} — imagem ${i + 1}`}
                loading={i === 0 ? "eager" : "lazy"}
                width={400}
                height={300}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Dot indicators — purely decorative, positioned over image */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-2 left-0 right-0 flex justify-center gap-1.5"
        >
          {images.map((_, i) => (
            <span
              key={i}
              className="block h-1.5 w-1.5 rounded-full bg-white shadow drop-shadow"
            />
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          DESKTOP — main image + thumbnail strip
          Active thumbnail changes the displayed main image.
      ══════════════════════════════════════════════════════════════════ */}
      <div className="hidden md:flex md:flex-col">
        {/* Main image */}
        <div className="aspect-[4/3] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[activeIdx].imageUrl}
            alt={`${productName} — imagem ${activeIdx + 1}`}
            loading="lazy"
            width={400}
            height={300}
            className="h-full w-full object-cover transition-opacity duration-150"
          />
        </div>

        {/* Thumbnail strip */}
        <div className="flex gap-1.5 px-2 py-2 bg-[rgb(var(--color-bg-muted))]">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              aria-label={`Exibir imagem ${i + 1} de ${productName}`}
              aria-pressed={i === activeIdx}
              onClick={() => setActiveIdx(i)}
              className={[
                "relative h-12 w-12 shrink-0 overflow-hidden rounded transition-all",
                "border-2 focus:outline-none focus:ring-2",
                "focus:ring-[rgb(var(--color-primary))] focus:ring-offset-1",
                i === activeIdx
                  ? "border-[rgb(var(--color-primary))] opacity-100"
                  : "border-transparent opacity-60 hover:opacity-90 hover:border-[rgb(var(--color-border))]",
              ].join(" ")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.imageUrl}
                alt=""
                aria-hidden="true"
                loading="lazy"
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
