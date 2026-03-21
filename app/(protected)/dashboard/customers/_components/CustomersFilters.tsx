"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition, useState } from "react";
import { Button } from "../../../../_components/Button";

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * CustomersFilters — URL-synced filter bar for the customers page.
 *
 * URL params:
 *   search     — partial match on customer name or whatsapp
 *   min_orders — minimum number of completed orders (≥1)
 *   min_spent  — minimum total spent in cents (≥0, stored as float)
 */
export function CustomersFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Applied values from URL
  const appliedSearch = params.get("search") ?? "";
  const appliedMinOrders = params.get("min_orders") ?? "";
  const appliedMinSpent = params.get("min_spent") ?? "";

  // ── Draft state (local form values, not yet applied) ──────────────────────
  const [draftSearch, setDraftSearch] = useState(appliedSearch);
  const [draftMinOrders, setDraftMinOrders] = useState(appliedMinOrders);
  const [draftMinSpent, setDraftMinSpent] = useState(appliedMinSpent);

  const hasFilters =
    appliedSearch !== "" || appliedMinOrders !== "" || appliedMinSpent !== "";

  // ── Apply all drafts to the URL at once ───────────────────────────────────

  const applyFilters = useCallback(() => {
    const next = new URLSearchParams(params.toString());
    if (draftSearch.trim()) next.set("search", draftSearch.trim());
    else next.delete("search");
    if (draftMinOrders) next.set("min_orders", draftMinOrders);
    else next.delete("min_orders");
    if (draftMinSpent) next.set("min_spent", draftMinSpent);
    else next.delete("min_spent");
    next.delete("page");
    startTransition(() => {
      router.push(`?${next.toString()}`);
    });
  }, [draftSearch, draftMinOrders, draftMinSpent, params, router]);

  function handleClear() {
    setDraftSearch("");
    setDraftMinOrders("");
    setDraftMinSpent("");
    startTransition(() => {
      router.push("?");
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") applyFilters();
  }

  return (
    <div
      className={[
        "rounded-xl border border-line bg-surface p-4 shadow-sm",
        isPending ? "opacity-60" : "",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-end gap-3">
        {/* Search */}
        <div className="min-w-50 flex-1">
          <label
            htmlFor="cf-search"
            className="mb-1 block text-xs font-medium text-foreground-muted"
          >
            Buscar cliente
          </label>
          <input
            id="cf-search"
            type="text"
            value={draftSearch}
            placeholder="Nome ou telefone…"
            onChange={(e) => setDraftSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className={[
              "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm",
              "text-foreground placeholder:text-foreground-muted",
              "focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent",
            ].join(" ")}
          />
        </div>

        {/* Min orders */}
        <div className="w-36">
          <label
            htmlFor="cf-min-orders"
            className="mb-1 block text-xs font-medium text-foreground-muted"
          >
            Mín. de pedidos
          </label>
          <input
            id="cf-min-orders"
            type="number"
            min={1}
            step={1}
            value={draftMinOrders}
            placeholder="Ex: 2"
            onChange={(e) => setDraftMinOrders(e.target.value)}
            onKeyDown={handleKeyDown}
            className={[
              "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm",
              "text-foreground placeholder:text-foreground-muted",
              "focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent",
            ].join(" ")}
          />
        </div>

        {/* Min spent */}
        <div className="w-44">
          <label
            htmlFor="cf-min-spent"
            className="mb-1 block text-xs font-medium text-foreground-muted"
          >
            Mín. gasto (R$)
          </label>
          <input
            id="cf-min-spent"
            type="number"
            min={0}
            step={0.01}
            value={draftMinSpent}
            placeholder="Ex: 100"
            onChange={(e) => setDraftMinSpent(e.target.value)}
            onKeyDown={handleKeyDown}
            className={[
              "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm",
              "text-foreground placeholder:text-foreground-muted",
              "focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent",
            ].join(" ")}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 self-end">
          <Button type="button" size="sm" onClick={applyFilters}>
            Filtrar
          </Button>
          {hasFilters && (
            <button
              type="button"
              onClick={handleClear}
              className={[
                "rounded-lg border border-line bg-surface-hover px-4 py-2",
                "text-sm text-foreground-muted transition-opacity hover:opacity-80",
              ].join(" ")}
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
