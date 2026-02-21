/**
 * ProductFilters — client-side filter / sort bar.
 *
 * "use client" because it reads from URL and pushes new searchParams.
 * All state lives in the URL (no useState for filter values):
 *   ?search=...  — text search
 *   ?status=all|active|inactive
 *   ?sort=name|price|createdAt  + ?order=asc|desc
 *
 * When the user changes a filter, router.push() updates the URL, which
 * causes the Server Component page to re-render with the new data.
 */

"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusFilter = "all" | "active" | "inactive";
type SortField = "name" | "price" | "createdAt";
type SortOrder = "asc" | "desc";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Ativos" },
  { value: "inactive", label: "Inativos" },
];

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "name__asc", label: "Nome (A–Z)" },
  { value: "name__desc", label: "Nome (Z–A)" },
  { value: "price__asc", label: "Preço (menor)" },
  { value: "price__desc", label: "Preço (maior)" },
  { value: "createdAt__desc", label: "Mais recentes" },
  { value: "createdAt__asc", label: "Mais antigos" },
];

// Shared input/select base classes using CSS Variables
const CONTROL_BASE = [
  "h-9 rounded-lg border border-[rgb(var(--color-border))]",
  "bg-[rgb(var(--color-bg))] text-sm text-[rgb(var(--color-text))]",
  "px-3 transition-colors",
  "hover:border-[rgb(var(--color-text-muted))]",
  "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))] focus:ring-offset-0",
  "placeholder:text-[rgb(var(--color-text-muted))]",
].join(" ");

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Read current values from URL with safe defaults
  const search = params.get("search") ?? "";
  const status = (params.get("status") ?? "all") as StatusFilter;
  const sort = params.get("sort") ?? "createdAt";
  const order = params.get("order") ?? "desc";
  const sortValue = `${sort}__${order}`;

  /** Update one or more params and push to the router */
  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      // Always reset to page 1 when a filter changes
      next.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${next.toString()}`);
      });
    },
    [params, pathname, router],
  );

  // ─── Event handlers ────────────────────────────────────────────────────────

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    updateParams({ search: e.target.value || null });
  }

  function handleStatus(value: StatusFilter) {
    updateParams({ status: value === "all" ? null : value });
  }

  function handleSort(e: React.ChangeEvent<HTMLSelectElement>) {
    const [field, dir] = e.target.value.split("__") as [SortField, SortOrder];
    updateParams({ sort: field, order: dir });
  }

  return (
    <div
      className={[
        "flex flex-col gap-3 sm:flex-row sm:items-center",
        isPending ? "opacity-70" : "opacity-100",
        "transition-opacity",
      ].join(" ")}
    >
      {/* ── Search ────────────────────────────────────────────────────── */}
      <div className="relative flex-1">
        {/* Search icon */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[rgb(var(--color-text-muted))]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 15.803a7.5 7.5 0 0 0 10.607 0Z"
            />
          </svg>
        </span>

        <input
          type="search"
          placeholder="Buscar produto..."
          defaultValue={search}
          onChange={handleSearch}
          aria-label="Buscar por nome"
          className={[CONTROL_BASE, "w-full pl-9 pr-4"].join(" ")}
        />
      </div>

      {/* ── Status filter pills ───────────────────────────────────────── */}
      <div
        className="flex shrink-0 items-center gap-1 rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg-muted))] p-1"
        role="group"
        aria-label="Filtrar por status"
      >
        {STATUS_OPTIONS.map((opt) => {
          const isActive = status === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleStatus(opt.value)}
              aria-pressed={isActive}
              className={[
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))] focus:ring-offset-0",
                isActive
                  ? "bg-[rgb(var(--color-bg))] text-[rgb(var(--color-text))] shadow-sm"
                  : "text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]",
              ].join(" ")}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* ── Sort select ───────────────────────────────────────────────── */}
      <select
        value={sortValue}
        onChange={handleSort}
        aria-label="Ordenar produtos"
        className={[CONTROL_BASE, "shrink-0 pr-8 sm:w-auto"].join(" ")}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
