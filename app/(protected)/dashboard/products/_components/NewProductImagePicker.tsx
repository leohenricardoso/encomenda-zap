"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImageSlot, type SlotState } from "./ImageSlot";

// ─── Types ────────────────────────────────────────────────────────────────────

const POSITIONS = [1, 2, 3] as const;
type Position = (typeof POSITIONS)[number];

interface Props {
  /** Currently selected (pending) files. */
  files: File[];
  /** Called whenever the pending file list changes. */
  onChange: (files: File[]) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * NewProductImagePicker
 *
 * A client-side image picker for the "New Product" form.
 * Unlike ProductImageUploader, this component does NOT upload anything
 * immediately — it only stores the selected File objects locally and
 * renders previews via object URLs.
 *
 * The parent form is responsible for uploading the files after the
 * product has been created (once a product ID is available).
 *
 * Visual layout and slot behaviour mirror ProductImageUploader exactly
 * so the two forms look consistent.
 */
export function NewProductImagePicker({ files, onChange }: Props) {
  // ── Object URL management ─────────────────────────────────────────────────
  // We keep a stable cache (ref) and create/revoke URLs synchronously inside
  // useMemo so there is never a render where files[i] has no matching URL.
  // A single unmount-only effect handles the final cleanup.
  const urlCacheRef = useRef(new Map<File, string>());

  useEffect(() => {
    // Only revoke all URLs on unmount — no cleanup between renders.
    return () => {
      for (const url of urlCacheRef.current.values()) URL.revokeObjectURL(url);
      urlCacheRef.current.clear();
    };
  }, []);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }, []);

  // ── Derive slot states from the files array ───────────────────────────────

  const slots: Record<Position, SlotState> = useMemo(() => {
    const cache = urlCacheRef.current;
    const fileSet = new Set(files);

    // Revoke and evict URLs for files no longer in the list
    for (const [file, url] of [...cache.entries()]) {
      if (!fileSet.has(file)) {
        URL.revokeObjectURL(url);
        cache.delete(file);
      }
    }

    // Create URLs synchronously for any new file — no async effect needed
    for (const file of files) {
      if (!cache.has(file)) {
        cache.set(file, URL.createObjectURL(file));
      }
    }

    // Build slot states — each file always maps to its own URL by reference
    const result: Record<Position, SlotState> = {
      1: { kind: "empty" },
      2: { kind: "empty" },
      3: { kind: "empty" },
    };
    for (let i = 0; i < Math.min(files.length, 3); i++) {
      const pos = (i + 1) as Position;
      result[pos] = {
        kind: "uploaded",
        id: `pending-${i}`,
        imageUrl: cache.get(files[i])!,
      };
    }
    return result;
  }, [files]);

  const nextEmptyPos = useMemo((): Position | null => {
    for (const pos of POSITIONS) {
      if (slots[pos].kind === "empty") return pos;
    }
    return null;
  }, [slots]);

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
      if (!nextEmptyPos) {
        showToast("Máximo de 3 imagens atingido.");
        return;
      }
      onChange([...files, file]);
    },
    [files, nextEmptyPos, onChange, showToast],
  );

  const handleRemove = useCallback(
    (pos: Position) => {
      const idx = pos - 1;
      onChange(files.filter((_, i) => i !== idx));
    },
    [files, onChange],
  );

  const handleSetPrimary = useCallback(
    (pos: Position) => {
      const idx = pos - 1;
      if (idx === 0) return; // already primary
      const file = files[idx];
      onChange([file, ...files.filter((_, i) => i !== idx)]);
    },
    [files, onChange],
  );

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

      {/* Pending-upload notice */}
      {files.length > 0 && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          {files.length === 1
            ? "1 imagem selecionada — será enviada ao salvar o produto."
            : `${files.length} imagens selecionadas — serão enviadas ao salvar o produto.`}
        </p>
      )}

      {/* 3-slot grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {POSITIONS.map((pos) => (
          <ImageSlot
            key={pos}
            position={pos}
            state={slots[pos]}
            isPrimary={pos === 1}
            disabled={false}
            onFileSelected={handleFileSelected}
            onRemove={() => handleRemove(pos)}
            onSetPrimary={() => handleSetPrimary(pos)}
          />
        ))}
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
