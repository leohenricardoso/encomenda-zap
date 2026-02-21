/**
 * DeleteProductButton — inline two-step delete confirmation.
 *
 * Step 1: Trash icon button (default state)
 * Step 2: "Confirmar exclusão?" with a red "Sim" and a "Não" button
 *
 * This replaces a modal for the MVP — keeps the component self-contained
 * and avoids an additional layer of complexity. A modal can be introduced later.
 *
 * On success: router.refresh() triggers cache invalidation so the Server
 * Component re-fetches and the deleted card disappears.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  productId: string;
  /** Shown in the confirmation prompt */
  productName: string;
}

export function DeleteProductButton({ productId, productName }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await fetch(`/api/products/${productId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  // ── Confirmation state ──────────────────────────────────────────────────────
  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <span
          className="truncate text-xs text-[rgb(var(--color-text-muted))]"
          title={`Excluir "${productName}"?`}
        >
          Excluir?
        </span>

        {/* Confirm */}
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          aria-label="Confirmar exclusão"
          className={[
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
            "border border-[rgb(239_68_68_/_0.3)] bg-[rgb(254_242_242)]",
            "text-[rgb(185_28_28)] transition-colors",
            "hover:bg-[rgb(254_226_226)]",
            "disabled:opacity-50",
            "focus:outline-none focus:ring-2 focus:ring-[rgb(239_68_68)] focus:ring-offset-0",
          ].join(" ")}
        >
          {loading ? (
            <svg
              className="h-3.5 w-3.5 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 00-10 10h4z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>

        {/* Cancel */}
        <button
          type="button"
          onClick={() => setConfirming(false)}
          aria-label="Cancelar exclusão"
          className={[
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
            "border border-[rgb(var(--color-border))]",
            "text-[rgb(var(--color-text-muted))] transition-colors",
            "hover:bg-[rgb(var(--color-bg-muted))]",
            "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))] focus:ring-offset-0",
          ].join(" ")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      </div>
    );
  }

  // ── Default state — trash icon ──────────────────────────────────────────────
  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label={`Excluir produto "${productName}"`}
      className={[
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
        "border border-[rgb(var(--color-border))]",
        "text-[rgb(var(--color-text-muted))] transition-colors",
        "hover:border-[rgb(239_68_68_/_0.4)] hover:bg-[rgb(254_242_242)] hover:text-[rgb(185_28_28)]",
        "focus:outline-none focus:ring-2 focus:ring-[rgb(239_68_68)] focus:ring-offset-0",
      ].join(" ")}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-3.5 w-3.5"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 3.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
}
