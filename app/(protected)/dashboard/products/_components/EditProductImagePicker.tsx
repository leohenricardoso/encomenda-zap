"use client";

/**
 * EditProductImagePicker — Deferred image management for the product edit form.
 *
 * Unlike ProductImageUploader, this component performs NO network calls.
 * All changes (add, remove, reorder) are kept in local state only.
 * The parent (ProductForm) applies them to S3/DB on form submit.
 *
 * Visual layout mirrors NewProductImagePicker for consistency.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ProductImage } from "@/domain/productImage/ProductImage";
import { ImageSlot, type SlotState } from "./ImageSlot";

// ─── Types ────────────────────────────────────────────────────────────────────

const POSITIONS = [1, 2, 3] as const;
type Position = (typeof POSITIONS)[number];

/**
 * A slot can hold a persisted image (existing), a locally-staged file
 * (pending), or be unoccupied (empty).
 */
export type LocalSlot =
  | { kind: "existing"; id: string; imageUrl: string }
  | { kind: "pending"; file: File; tempId: string }
  | { kind: "empty" };

interface Props {
  initialImages: ProductImage[];
  /** Controlled ordered array of occupied slots (max 3). Index 0 = position 1 = primary. */
  slots: LocalSlot[];
  onChange: (newSlots: LocalSlot[]) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build the initial controlled slot array from server images (sorted by
 * position ascending so slot[0] always = position 1 = primary).
 */
export function buildInitialSlots(images: ProductImage[]): LocalSlot[] {
  return [...images]
    .sort((a, b) => a.position - b.position)
    .map(
      (img): LocalSlot => ({
        kind: "existing",
        id: img.id,
        imageUrl: img.imageUrl,
      }),
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EditProductImagePicker({
  initialImages,
  slots,
  onChange,
}: Props) {
  // ── Object URL lifecycle ──────────────────────────────────────────────────
  // Maps File → blob URL. Created on demand; revoked on file eviction / unmount.
  const urlCacheRef = useRef(new Map<File, string>());

  useEffect(() => {
    return () => {
      for (const url of urlCacheRef.current.values()) URL.revokeObjectURL(url);
      urlCacheRef.current.clear();
    };
  }, []);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }, []);

  // ── Derive ImageSlot states from controlled slots ─────────────────────────
  // Existing images  → { kind: "uploaded", id, imageUrl }
  // Pending files    → { kind: "uploaded", id: tempId, imageUrl: blobUrl }
  // Unfilled 1–3     → { kind: "empty" }
  const slotStates = useMemo<Record<Position, SlotState>>(() => {
    const cache = urlCacheRef.current;

    // Build the set of currently pending files for URL management
    const pendingFiles = new Set(
      slots
        .filter(
          (s): s is Extract<LocalSlot, { kind: "pending" }> =>
            s.kind === "pending",
        )
        .map((s) => s.file),
    );

    // Revoke and evict URLs for files no longer in the slot list
    for (const [file, url] of [...cache.entries()]) {
      if (!pendingFiles.has(file)) {
        URL.revokeObjectURL(url);
        cache.delete(file);
      }
    }

    // Create blob URLs for newly added pending files
    for (const s of slots) {
      if (s.kind === "pending" && !cache.has(s.file)) {
        cache.set(s.file, URL.createObjectURL(s.file));
      }
    }

    // Map occupied slots to position-keyed record
    const result: Record<Position, SlotState> = {
      1: { kind: "empty" },
      2: { kind: "empty" },
      3: { kind: "empty" },
    };

    for (let i = 0; i < Math.min(slots.length, 3); i++) {
      const s = slots[i];
      const pos = (i + 1) as Position;
      if (s.kind === "existing") {
        result[pos] = { kind: "uploaded", id: s.id, imageUrl: s.imageUrl };
      } else if (s.kind === "pending") {
        result[pos] = {
          kind: "uploaded",
          // tempId acts as stable React key and identity for setPrimary detection
          id: s.tempId,
          imageUrl: cache.get(s.file)!,
        };
      }
    }

    return result;
  }, [slots]);

  const canAdd = slots.length < 3;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleFileSelected = useCallback(
    (file: File) => {
      if (!ALLOWED_TYPES.has(file.type)) {
        showToast("Formato inválido. Use JPEG, PNG ou WebP.");
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        showToast("Arquivo muito grande. O tamanho máximo é 3 MB.");
        return;
      }
      if (!canAdd) {
        showToast("Máximo de 3 imagens atingido.");
        return;
      }
      const tempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      onChange([...slots, { kind: "pending", file, tempId }]);
    },
    [slots, canAdd, onChange, showToast],
  );

  const handleRemove = useCallback(
    (pos: Position) => {
      const idx = pos - 1;
      // Filter out the removed slot; remaining slots compact automatically
      onChange(slots.filter((_, i) => i !== idx));
    },
    [slots, onChange],
  );

  const handleSetPrimary = useCallback(
    (pos: Position) => {
      const idx = pos - 1;
      if (idx === 0) return; // already primary
      const target = slots[idx];
      // Move selected item to front; existing order of others is preserved
      onChange([target, ...slots.filter((_, i) => i !== idx)]);
    },
    [slots, onChange],
  );

  // ── Change detection — drives the informational banner ───────────────────

  const hasChanges = useMemo(() => {
    const initialIds = new Set(initialImages.map((i) => i.id));
    const keptIds = new Set(
      slots
        .filter(
          (s): s is Extract<LocalSlot, { kind: "existing" }> =>
            s.kind === "existing",
        )
        .map((s) => s.id),
    );
    const removedCount = [...initialIds].filter(
      (id) => !keptIds.has(id),
    ).length;
    const pendingCount = slots.filter((s) => s.kind === "pending").length;
    return removedCount > 0 || pendingCount > 0;
  }, [initialImages, slots]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <section aria-label="Imagens do produto" className="space-y-4">
      {/* Section header */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700">
          Imagens do produto
        </h2>
        <p className="mt-0.5 text-xs text-gray-500">
          Até 3 imagens · JPEG, PNG ou WebP · Máx. 3&nbsp;MB ·{" "}
          <span className="font-medium">Posição 1 = imagem principal</span>
        </p>
      </div>

      {/* Pending-changes notice */}
      {hasChanges && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          Alterações nas imagens serão aplicadas ao salvar o produto.
        </p>
      )}

      {/* 3-slot grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {POSITIONS.map((pos) => {
          const state = slotStates[pos];
          // Use stable identity — never array index
          const stableKey =
            state.kind === "uploaded" ? state.id : `empty-${pos}`;
          return (
            <ImageSlot
              key={stableKey}
              position={pos}
              state={state}
              isPrimary={pos === 1}
              disabled={false}
              onFileSelected={handleFileSelected}
              onRemove={() => handleRemove(pos)}
              onSetPrimary={() => handleSetPrimary(pos)}
            />
          );
        })}
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="mt-px h-4 w-4 shrink-0 text-red-500"
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
            className="ml-auto shrink-0 text-red-500 hover:text-red-700"
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
