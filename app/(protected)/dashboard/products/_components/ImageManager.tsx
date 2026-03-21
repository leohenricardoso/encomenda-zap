"use client";

/**
 * ImageManager — 3-slot image management panel for a product.
 *
 * Rules:
 *  - Up to 3 images per product.
 *  - Position 1 is the primary / catalog image (shown first).
 *  - Each empty slot shows a URL input + "Adicionar" button.
 *  - Each occupied slot shows the image, a "Remover" button, and (if not
 *    already primary) a "Tornar principal" button.
 */

import { useState, useTransition } from "react";
import type { ProductImage } from "@/domain/productImage/ProductImage";
import { Button } from "../../../../_components/Button";

interface Props {
  productId: string;
  initialImages: ProductImage[];
}

// ─── Slot helpers ─────────────────────────────────────────────────────────────

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

// ─── Slot types ───────────────────────────────────────────────────────────────

interface FilledSlotProps {
  image: ProductImage;
  onRemove: (id: string) => void;
  onSetPrimary: (id: string) => void;
  busy: boolean;
}

function FilledSlot({ image, onRemove, onSetPrimary, busy }: FilledSlotProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-[rgb(var(--color-border))]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.imageUrl}
          alt=""
          className="h-full w-full object-cover"
        />

        {image.position === 1 && (
          <div className="absolute left-1.5 top-1.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow">
            Principal
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {image.position !== 1 && (
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            disabled={busy}
            onClick={() => onSetPrimary(image.id)}
          >
            Tornar principal
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className={image.position === 1 ? "flex-1" : ""}
          disabled={busy}
          onClick={() => onRemove(image.id)}
        >
          Remover
        </Button>
      </div>
    </div>
  );
}

interface EmptySlotProps {
  onAdd: (url: string) => void;
  busy: boolean;
}

function EmptySlot({ onAdd, busy }: EmptySlotProps) {
  const [url, setUrl] = useState("");

  const handleAdd = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setUrl("");
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-dashed border-[rgb(var(--color-border))]">
        <ImagePlaceholder />
      </div>

      <div className="flex gap-1.5">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="URL da imagem"
          disabled={busy}
          className={[
            "min-w-0 flex-1 rounded-lg border border-[rgb(var(--color-border))]",
            "bg-[rgb(var(--color-bg))] px-2.5 py-1.5 text-xs",
            "placeholder:text-[rgb(var(--color-text-muted))]",
            "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-1",
            "disabled:opacity-50",
          ].join(" ")}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
        />
        <Button
          variant="primary"
          size="sm"
          disabled={busy || !url.trim()}
          onClick={handleAdd}
        >
          Adicionar
        </Button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ImageManager({ productId, initialImages }: Props) {
  const [images, setImages] = useState<ProductImage[]>(initialImages);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // ── Add ────────────────────────────────────────────────────────────────────

  const handleAdd = (imageUrl: string) => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/products/${productId}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl }),
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setError(body.error ?? "Não foi possível adicionar a imagem.");
          return;
        }

        const added = (await res.json()) as ProductImage;
        setImages((prev) => [...prev, added]);
      } catch {
        setError("Erro de conexão. Tente novamente.");
      }
    });
  };

  // ── Remove ─────────────────────────────────────────────────────────────────

  const handleRemove = (imageId: string) => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/products/images/${imageId}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setError(body.error ?? "Não foi possível remover a imagem.");
          return;
        }

        const remaining = (await res.json()) as ProductImage[];
        setImages(remaining);
      } catch {
        setError("Erro de conexão. Tente novamente.");
      }
    });
  };

  // ── Set primary ────────────────────────────────────────────────────────────

  const handleSetPrimary = (imageId: string) => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/products/images/${imageId}/primary`, {
          method: "PATCH",
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setError(
            body.error ?? "Não foi possível atualizar a imagem principal.",
          );
          return;
        }

        const updated = (await res.json()) as ProductImage[];
        setImages(updated);
      } catch {
        setError("Erro de conexão. Tente novamente.");
      }
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-[rgb(var(--color-text))]">
          Imagens
        </h2>
        <p className="mt-0.5 text-xs text-[rgb(var(--color-text-muted))]">
          Até 3 imagens. A imagem na posição 1 é a imagem principal do catálogo.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((slot) => {
          const img = images.find((i) => i.position === slot);
          return img ? (
            <FilledSlot
              key={img.id}
              image={img}
              onRemove={handleRemove}
              onSetPrimary={handleSetPrimary}
              busy={isPending}
            />
          ) : (
            <EmptySlot key={slot} onAdd={handleAdd} busy={isPending} />
          );
        })}
      </div>
    </section>
  );
}
