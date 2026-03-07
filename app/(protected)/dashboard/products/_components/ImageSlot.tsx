"use client";

import { useRef, useState } from "react";
import { UploadProgress } from "./UploadProgress";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SlotState =
  | { kind: "empty" }
  | { kind: "uploading"; previewUrl: string; progress: number }
  | { kind: "uploaded"; id: string; imageUrl: string }
  | { kind: "deleting"; id: string; imageUrl: string };

interface ImageSlotProps {
  position: number;
  state: SlotState;
  isPrimary: boolean;
  disabled: boolean;
  onFileSelected: (file: File) => void;
  onRemove: () => void;
  onSetPrimary: () => void;
}

// ─── Accepted types ───────────────────────────────────────────────────────────

const ACCEPT = "image/jpeg,image/png,image/webp";

// ─── Component ────────────────────────────────────────────────────────────────

export function ImageSlot({
  position,
  state,
  isPrimary,
  disabled,
  onFileSelected,
  onRemove,
  onSetPrimary,
}: ImageSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // ── Drag handlers ──────────────────────────────────────────────────────────

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && state.kind === "empty") setIsDragOver(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && state.kind === "empty") setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear when leaving the actual drop zone (not a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || state.kind !== "empty") return;

    const file = e.dataTransfer.files[0];
    if (file) onFileSelected(file);
  };

  const handleClick = () => {
    if (!disabled && state.kind === "empty") {
      inputRef.current?.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file);
      // Reset so the same file can be selected again if needed
      e.target.value = "";
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const isUploaded = state.kind === "uploaded";
  const isUploading = state.kind === "uploading";
  const isDeleting = state.kind === "deleting";
  const isEmpty = state.kind === "empty";

  // Base aspect + rounded container
  const containerBase =
    "relative aspect-square w-full overflow-hidden rounded-xl";

  return (
    <div className="flex flex-col gap-2">
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        onChange={handleInputChange}
      />

      {/* ── Slot surface ─────────────────────────────────────────────────── */}
      {isEmpty && (
        <button
          type="button"
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          disabled={disabled}
          aria-label={`Slot de imagem ${position} — clique ou arraste uma imagem`}
          className={[
            containerBase,
            "border-2 border-dashed",
            "flex flex-col items-center justify-center gap-2 p-4",
            "cursor-pointer text-center select-none",
            "transition-colors duration-150",
            isDragOver
              ? "border-accent bg-accent/5 text-accent"
              : "border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg-muted))] text-[rgb(var(--color-text-muted))]",
            "hover:border-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-bg-muted))]",
            "disabled:pointer-events-none disabled:opacity-40",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
          ].join(" ")}
        >
          {/* Upload icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-7 w-7 shrink-0"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
            />
          </svg>

          <span className="text-[11px] leading-snug">
            {isDragOver ? (
              "Solte aqui"
            ) : (
              <>
                Arraste a imagem ou{" "}
                <span className="font-semibold underline underline-offset-2">
                  clique para enviar
                </span>
              </>
            )}
          </span>
        </button>
      )}

      {(isUploading || isUploaded || isDeleting) && (
        <div className={containerBase}>
          {/* Image preview */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              isUploading
                ? (state as Extract<SlotState, { kind: "uploading" }>)
                    .previewUrl
                : (
                    state as Extract<
                      SlotState,
                      { kind: "uploaded" | "deleting" }
                    >
                  ).imageUrl
            }
            alt={`Imagem ${position}`}
            className="h-full w-full object-cover"
          />

          {/* Primary badge — hidden while deleting */}
          {isPrimary && !isDeleting && (
            <span className="absolute left-2 top-2 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
              Principal
            </span>
          )}

          {/* Upload progress overlay */}
          {isUploading && (
            <UploadProgress
              progress={
                (state as Extract<SlotState, { kind: "uploading" }>).progress
              }
            />
          )}

          {/* Deleting overlay */}
          {isDeleting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 p-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-5 w-5 animate-spin text-white"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
              <span className="text-xs font-medium text-white drop-shadow">
                Removendo...
              </span>
            </div>
          )}

          {/* Remove button — top right, only when fully uploaded */}
          {isUploaded && (
            <button
              type="button"
              onClick={onRemove}
              disabled={disabled}
              aria-label="Remover imagem"
              className={[
                "absolute right-2 top-2",
                "flex h-7 w-7 items-center justify-center rounded-full",
                "bg-black/60 text-white shadow",
                "transition-colors hover:bg-red-600/90",
                "disabled:pointer-events-none disabled:opacity-50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
              ].join(" ")}
            >
              {/* Trash icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-3.5 w-3.5"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* ── Below-slot actions ────────────────────────────────────────────── */}
      {isUploaded && !isPrimary && (
        <button
          type="button"
          onClick={onSetPrimary}
          disabled={disabled}
          className={[
            "w-full rounded-lg border border-[rgb(var(--color-border))]",
            "px-2 py-1 text-[11px] font-medium text-[rgb(var(--color-text-muted))]",
            "transition-colors hover:bg-[rgb(var(--color-bg-muted))] hover:text-[rgb(var(--color-text))]",
            "disabled:pointer-events-none disabled:opacity-50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
          ].join(" ")}
        >
          Tornar principal
        </button>
      )}
    </div>
  );
}
