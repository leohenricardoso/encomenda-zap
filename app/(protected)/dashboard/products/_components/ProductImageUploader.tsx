"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { ProductImage } from "@/domain/productImage/ProductImage";
import { ImageSlot, type SlotState } from "./ImageSlot";

// ─── Types ────────────────────────────────────────────────────────────────────

const POSITIONS = [1, 2, 3] as const;
type Position = (typeof POSITIONS)[number];
type Slots = Record<Position, SlotState>;

interface Props {
  productId: string;
  initialImages: ProductImage[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildInitialSlots(images: ProductImage[]): Slots {
  const slots: Slots = {
    1: { kind: "empty" },
    2: { kind: "empty" },
    3: { kind: "empty" },
  };
  for (const img of images) {
    if (img.position === 1 || img.position === 2 || img.position === 3) {
      slots[img.position as Position] = {
        kind: "uploaded",
        id: img.id,
        imageUrl: img.imageUrl,
      };
    }
  }
  return slots;
}

/**
 * XHR-based upload so we get granular progress events.
 * fetch() does not expose upload progress natively.
 */
function uploadFile(
  productId: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<{ id: string; imageUrl: string; position: number }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("file", file);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const body = JSON.parse(xhr.responseText) as {
            success: boolean;
            data: { id: string; imageUrl: string; position: number };
          };
          resolve(body.data);
        } catch {
          reject(new Error("Resposta inválida do servidor."));
        }
        return;
      }
      try {
        const body = JSON.parse(xhr.responseText) as {
          error?: { message?: string };
        };
        reject(new Error(body.error?.message ?? "Erro no upload."));
      } catch {
        reject(new Error(`Erro no upload (${xhr.status}).`));
      }
    });

    xhr.addEventListener("error", () =>
      reject(new Error("Erro de rede. Tente novamente.")),
    );
    xhr.addEventListener("abort", () => reject(new Error("Upload cancelado.")));

    xhr.open("POST", `/api/products/${productId}/images/upload`);
    xhr.send(form);
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductImageUploader({ productId, initialImages }: Props) {
  const [slots, setSlots] = useState<Slots>(() =>
    buildInitialSlots(initialImages),
  );
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Toast ──────────────────────────────────────────────────────────────────

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }, []);

  // ── Derived state ──────────────────────────────────────────────────────────

  const isUploadingAny = useMemo(
    () => Object.values(slots).some((s) => s.kind === "uploading"),
    [slots],
  );

  const isRemovingAny = useMemo(
    () => Object.values(slots).some((s) => s.kind === "deleting"),
    [slots],
  );

  // Disable all interactions while any upload or removal is in progress
  const isBusy = isUploadingAny || isRemovingAny;

  const nextEmptyPos = useMemo((): Position | null => {
    for (const pos of POSITIONS) {
      if (slots[pos].kind === "empty") return pos;
    }
    return null;
  }, [slots]);

  // ── Upload ─────────────────────────────────────────────────────────────────

  const handleFileSelected = useCallback(
    async (file: File) => {
      // ── Frontend validation ──────────────────────────────────────────────
      if (!ALLOWED_TYPES.has(file.type)) {
        showToast("Formato inválido. Use JPEG, PNG ou WebP.");
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        showToast("Arquivo muito grande. O tamanho máximo é 3 MB.");
        return;
      }
      if (!nextEmptyPos) {
        showToast("Máximo de 3 imagens atingido.");
        return;
      }

      // ── Show preview instantly ───────────────────────────────────────────
      const previewUrl = URL.createObjectURL(file);
      const uploadingPos = nextEmptyPos;

      setSlots((prev) => ({
        ...prev,
        [uploadingPos]: { kind: "uploading", previewUrl, progress: 0 },
      }));

      try {
        const result = await uploadFile(productId, file, (pct) => {
          setSlots((prev) => {
            const current = prev[uploadingPos];
            if (current.kind !== "uploading") return prev;
            return {
              ...prev,
              [uploadingPos]: { ...current, progress: pct },
            };
          });
        });

        URL.revokeObjectURL(previewUrl);

        const actualPos = result.position as Position;

        setSlots((prev) => {
          const next = { ...prev };
          // Clear the placeholder slot if it differs from the real position
          if (uploadingPos !== actualPos) {
            next[uploadingPos] = { kind: "empty" };
          }
          next[actualPos] = {
            kind: "uploaded",
            id: result.id,
            imageUrl: result.imageUrl,
          };
          return next;
        });
      } catch (err) {
        URL.revokeObjectURL(previewUrl);
        setSlots((prev) => ({ ...prev, [uploadingPos]: { kind: "empty" } }));
        showToast(err instanceof Error ? err.message : "Erro no upload.");
      }
    },
    [productId, nextEmptyPos, showToast],
  );

  // ── Remove ─────────────────────────────────────────────────────────────────

  const handleRemove = useCallback(
    async (pos: Position) => {
      const slot = slots[pos];
      if (slot.kind !== "uploaded") return;

      // Ask for confirmation before making any network call
      if (
        !window.confirm("Remover esta imagem? A ação não pode ser desfeita.")
      ) {
        return;
      }

      // Optimistic UI: show spinner overlay on this slot
      const savedSlot = slot;
      setSlots((prev) => ({
        ...prev,
        [pos]: {
          kind: "deleting",
          id: savedSlot.id,
          imageUrl: savedSlot.imageUrl,
        },
      }));

      try {
        const res = await fetch(`/api/products/images/${savedSlot.id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: { message?: string };
          };
          throw new Error(
            body.error?.message ?? "Não foi possível remover a imagem.",
          );
        }

        // Backend returns the updated image list after position repack
        const body = (await res.json()) as {
          success: boolean;
          data: Array<{ id: string; imageUrl: string; position: number }>;
        };

        // Rebuild all slots from the server's canonical state
        setSlots((prev) => {
          const next: Slots = {
            1: prev[1].kind === "uploading" ? prev[1] : { kind: "empty" },
            2: prev[2].kind === "uploading" ? prev[2] : { kind: "empty" },
            3: prev[3].kind === "uploading" ? prev[3] : { kind: "empty" },
          };
          for (const img of body.data) {
            const p = img.position as Position;
            if (p === 1 || p === 2 || p === 3) {
              next[p] = {
                kind: "uploaded",
                id: img.id,
                imageUrl: img.imageUrl,
              };
            }
          }
          return next;
        });

        showToast("✓ Imagem removida com sucesso.");
      } catch (err) {
        // Restore the slot to its prior state on failure
        setSlots((prev) => ({ ...prev, [pos]: savedSlot }));
        showToast(err instanceof Error ? err.message : "Erro ao remover.");
      }
    },
    [slots, showToast],
  );

  // ── Set primary ────────────────────────────────────────────────────────────

  const handleSetPrimary = useCallback(
    async (pos: Position) => {
      const slot = slots[pos];
      if (slot.kind !== "uploaded") return;

      try {
        const res = await fetch(`/api/products/images/${slot.id}/primary`, {
          method: "PATCH",
        });
        if (!res.ok) {
          throw new Error("Não foi possível definir a imagem principal.");
        }

        const body = (await res.json()) as {
          success: boolean;
          data: Array<{ id: string; imageUrl: string; position: number }>;
        };

        setSlots((prev) => {
          // Start with current state so in-progress uploads are preserved
          const next: Slots = {
            1: prev[1].kind === "uploading" ? prev[1] : { kind: "empty" },
            2: prev[2].kind === "uploading" ? prev[2] : { kind: "empty" },
            3: prev[3].kind === "uploading" ? prev[3] : { kind: "empty" },
          };
          for (const img of body.data) {
            const p = img.position as Position;
            if (p === 1 || p === 2 || p === 3) {
              next[p] = {
                kind: "uploaded",
                id: img.id,
                imageUrl: img.imageUrl,
              };
            }
          }
          return next;
        });
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : "Erro ao atualizar imagem.",
        );
      }
    },
    [slots, showToast],
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <section aria-label="Imagens do produto" className="space-y-4">
      {/* Section header */}
      <div>
        <h2 className="text-sm font-semibold text-[rgb(var(--color-text))]">
          Imagens do produto
        </h2>
        <p className="mt-0.5 text-xs text-[rgb(var(--color-text-muted))]">
          Até 3 imagens · JPEG, PNG ou WebP · Máx. 3&nbsp;MB ·{" "}
          <span className="font-medium">Posição 1 = imagem principal</span>
        </p>
      </div>

      {/* 3-slot grid — 1 col mobile, 2 col tablet, 3 col desktop */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {POSITIONS.map((pos) => {
          const slot = slots[pos];
          const stableKey =
            slot.kind === "uploaded" || slot.kind === "deleting"
              ? slot.id
              : `${slot.kind}-${pos}`;
          return (
            <ImageSlot
              key={stableKey}
              position={pos}
              state={slot}
              isPrimary={pos === 1}
              disabled={isBusy}
              onFileSelected={handleFileSelected}
              onRemove={() => void handleRemove(pos)}
              onSetPrimary={() => void handleSetPrimary(pos)}
            />
          );
        })}
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          role="alert"
          aria-live="assertive"
          className={[
            "flex items-start gap-2 rounded-lg border px-4 py-3 text-xs",
            toast.startsWith("\u2713")
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-700",
          ].join(" ")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={[
              "mt-px h-4 w-4 shrink-0",
              toast.startsWith("✓") ? "text-green-600" : "text-red-500",
            ].join(" ")}
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-.75-4.75a.75.75 0 0 0 1.5 0V10a.75.75 0 0 0-1.5 0v3.25Zm.75-5.5a.875.875 0 1 0 0-1.75.875.875 0 0 0 0 1.75Z"
              clipRule="evenodd"
            />
          </svg>
          <span>{toast}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Fechar"
            className={[
              "ml-auto shrink-0",
              toast.startsWith("✓")
                ? "text-green-600 hover:text-green-800"
                : "text-red-500 hover:text-red-700",
            ].join(" ")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}
