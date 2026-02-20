"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  productId: string;
  isActive: boolean;
}

/**
 * Calls PUT /api/products/:id to toggle isActive.
 * Refreshes the page (server re-fetch) on success so the table reflects the change.
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
      router.refresh(); // triggers server component re-fetch
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      aria-label={isActive ? "Deactivate product" : "Activate product"}
    >
      {loading ? "…" : isActive ? "Deactivate" : "Activate"}
    </button>
  );
}
