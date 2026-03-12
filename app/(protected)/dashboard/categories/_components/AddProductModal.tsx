"use client";

import { useState } from "react";
import type { Product } from "@/domain/product/Product";

interface Props {
  categoryId: string;
  storeId: string;
  allProducts: Product[];
}

export function AddProductModal({ categoryId, allProducts }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [assigning, setAssigning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = allProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleAssign(productId: string) {
    setAssigning(productId);
    setError(null);
    try {
      const res = await fetch(`/api/categories/${categoryId}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { message?: string }).message ?? "Erro ao adicionar.",
        );
      }
      // Close and let SortableProductList re-fetch via its own effect
      setOpen(false);
      setSearch("");
      // Trigger a page refresh so SortableProductList reloads
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setAssigning(null);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-black/80 transition-colors"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Adicionar produto
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-md rounded-xl border border-line bg-surface p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">
                Adicionar produto à categoria
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="text-foreground-muted hover:text-foreground"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produto..."
              className="mb-3 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              autoFocus
            />

            {error && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="max-h-64 overflow-y-auto flex flex-col gap-1">
              {filtered.length === 0 ? (
                <p className="py-4 text-center text-sm text-foreground-muted">
                  Nenhum produto encontrado.
                </p>
              ) : (
                filtered.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleAssign(p.id)}
                    disabled={assigning === p.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm hover:bg-surface-subtle disabled:opacity-50 transition-colors"
                  >
                    <span className="text-foreground">{p.name}</span>
                    <span className="text-xs text-accent font-medium">
                      {assigning === p.id ? "Adicionando..." : "Adicionar"}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
