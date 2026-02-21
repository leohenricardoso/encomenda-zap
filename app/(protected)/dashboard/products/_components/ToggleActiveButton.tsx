"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  productId: string;
  isActive: boolean;
}

/**
 * Calls PUT /api/products/:id to toggle isActive.
 * Refreshes via router.refresh() so the Server Component re-fetches.
 *
 * Visually: compact icon-free button that fits the card actions row.
 *   Active   → muted "Desativar" (secondary destructive intent)
 *   Inactive → subtle "Ativar" (positive action)
 */
export default function ToggleActiveButton({ productId, isActive }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      aria-label={isActive ? "Desativar produto" : "Ativar produto"}
      className={[
        "flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium",
        "transition-colors disabled:opacity-50 disabled:pointer-events-none",
        "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))] focus:ring-offset-0",
        isActive
          ? // Active → muted style so deactivating feels "safe, not alarming"
            [
              "border-[rgb(var(--color-border))]",
              "text-[rgb(var(--color-text-muted))]",
              "hover:border-[rgb(239_68_68_/_0.4)] hover:bg-[rgb(254_242_242)] hover:text-[rgb(185_28_28)]",
            ].join(" ")
          : // Inactive → accent tint encourages re-activation
            [
              "border-[rgb(var(--color-accent)_/_0.3)]",
              "text-[rgb(var(--color-accent))]",
              "hover:bg-[rgb(239_246_255)]",
            ].join(" "),
      ].join(" ")}
    >
      {loading ? "…" : isActive ? "Desativar" : "Ativar"}
    </button>
  );
}
