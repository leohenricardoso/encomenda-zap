"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

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

  const search = params.get("search") ?? "";
  const minOrders = params.get("min_orders") ?? "";
  const minSpent = params.get("min_spent") ?? "";

  const hasFilters = search !== "" || minOrders !== "" || minSpent !== "";

  // Build a new URLSearchParams, reset page to 1, then push.
  const push = useCallback(
    (updates: Record<string, string>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === "") {
          next.delete(k);
        } else {
          next.set(k, v);
        }
      }
      next.delete("page"); // always reset to first page on filter change
      startTransition(() => {
        router.push(`?${next.toString()}`);
      });
    },
    [router, params],
  );

  const handleClear = () => {
    startTransition(() => {
      router.push("?");
    });
  };

  return (
    <div
      className={[
        "rounded-xl border border-line bg-surface p-4 shadow-sm",
        isPending ? "opacity-60" : "",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-end gap-3">
        {/* Search */}
        <div className="min-w-[200px] flex-1">
          <label
            htmlFor="cf-search"
            className="mb-1 block text-xs font-medium text-foreground-muted"
          >
            Buscar cliente
          </label>
          <input
            id="cf-search"
            type="text"
            value={search}
            placeholder="Nome ou telefone…"
            onChange={(e) => push({ search: e.target.value })}
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
            value={minOrders}
            placeholder="Ex: 2"
            onChange={(e) => push({ min_orders: e.target.value })}
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
            value={minSpent}
            placeholder="Ex: 100"
            onChange={(e) => push({ min_spent: e.target.value })}
            className={[
              "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm",
              "text-foreground placeholder:text-foreground-muted",
              "focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent",
            ].join(" ")}
          />
        </div>

        {/* Clear */}
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
  );
}
