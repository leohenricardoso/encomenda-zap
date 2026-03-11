"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { OrderStatus } from "@/domain/order/Order";
import { STATUS_CONFIG } from "./StatusBadge";
import { parseFilters } from "../_lib/filters";

//  Helpers

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowStr() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

//  Date presets

type DatePreset = "tudo" | "hoje" | "amanha" | "periodo";

function detectPreset(from: string | null, to: string | null): DatePreset {
  const t = todayStr();
  const tm = tomorrowStr();
  if (!from && !to) return "tudo";
  if (from === t && to === t) return "hoje";
  if (from === tm && to === tm) return "amanha";
  return "periodo";
}

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: "tudo", label: "Tudo" },
  { key: "hoje", label: "Hoje" },
  { key: "amanha", label: "Amanhã" },
  { key: "periodo", label: "Período" },
];

//  Status options

const STATUS_OPTIONS: { value: OrderStatus | null; label: string }[] = [
  { value: null, label: "Todos" },
  ...Object.values(OrderStatus).map((s) => ({
    value: s,
    label: STATUS_CONFIG[s].label,
  })),
];

//  Component

/**
 * FilterBar  SaaS-style filter bar with search, date presets, and status chips.
 *
 * URL params (all optional):
 *   q       free-text search against customer name (debounced 350ms)
 *   from    YYYY-MM-DD  start of date range
 *   to      YYYY-MM-DD  end of date range
 *   status  PENDING | APPROVED | REJECTED
 */
export function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { from, to, status } = parseFilters(
    Object.fromEntries(searchParams.entries()),
  );

  const activePreset = detectPreset(from, to);
  const isFiltered = !!(from || to || status || searchParams.get("q"));

  //  Search with 350ms debounce

  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      if (searchValue.trim()) {
        next.set("q", searchValue.trim());
      } else {
        next.delete("q");
      }
      router.push(`?${next.toString()}`, { scroll: false });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  //  URL updater

  function push(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    router.push(`?${next.toString()}`, { scroll: false });
  }

  //  Handlers

  function handleDatePreset(preset: DatePreset) {
    const t = todayStr();
    const tm = tomorrowStr();
    if (preset === "tudo") push({ from: null, to: null });
    else if (preset === "hoje") push({ from: t, to: t });
    else if (preset === "amanha") push({ from: tm, to: tm });
    else push({ from: t, to: null });
  }

  function handleStatus(s: OrderStatus | null) {
    push({ status: s });
  }

  function handleFrom(v: string) {
    push({ from: v || null });
  }

  function handleTo(v: string) {
    push({ to: v || null });
  }

  function handleReset() {
    setSearchValue("");
    router.push("?", { scroll: false });
  }

  //  Render

  return (
    <div className="rounded-xl border border-line bg-surface p-4 space-y-3">
      {/* Search row */}
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
        <input
          type="search"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Buscar por nome do cliente…"
          className="w-full rounded-lg border border-line bg-surface-subtle py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-foreground-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>

      {/* Date + Status row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Date presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-foreground-muted shrink-0">
            Data
          </span>
          <div className="flex items-center gap-1 rounded-lg border border-line bg-surface-subtle p-0.5">
            {DATE_PRESETS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => handleDatePreset(key)}
                className={[
                  "rounded-md px-3 py-1 text-xs font-medium transition-all",
                  activePreset === key
                    ? "bg-foreground text-surface shadow-sm"
                    : "text-foreground-muted hover:text-foreground",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-foreground-muted shrink-0">
            Status
          </span>
          <div className="flex items-center gap-1 rounded-lg border border-line bg-surface-subtle p-0.5">
            {STATUS_OPTIONS.map(({ value, label }) => {
              const isActive = status === value;
              const activeCls =
                value === null
                  ? "bg-foreground text-surface shadow-sm"
                  : value === OrderStatus.PENDING
                    ? "bg-amber-400 text-amber-900 shadow-sm"
                    : value === OrderStatus.APPROVED
                      ? "bg-green-600 text-white shadow-sm"
                      : "bg-surface text-foreground shadow-sm";
              return (
                <button
                  key={value ?? "all"}
                  type="button"
                  onClick={() => handleStatus(value)}
                  className={[
                    "rounded-md px-3 py-1 text-xs font-medium transition-all whitespace-nowrap",
                    isActive
                      ? activeCls
                      : "text-foreground-muted hover:text-foreground",
                  ].join(" ")}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Date range inputs (periodo) */}
      {activePreset === "periodo" && (
        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-line">
          <span className="text-xs text-foreground-muted">Período:</span>
          <label className="flex items-center gap-1.5 text-xs text-foreground-muted">
            De
            <input
              type="date"
              value={from ?? ""}
              onChange={(e) => handleFrom(e.target.value)}
              className="rounded-lg border border-line bg-surface-subtle px-2.5 py-1.5 text-xs text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-foreground-muted">
            Até
            <input
              type="date"
              value={to ?? ""}
              min={from ?? undefined}
              onChange={(e) => handleTo(e.target.value)}
              className="rounded-lg border border-line bg-surface-subtle px-2.5 py-1.5 text-xs text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
        </div>
      )}

      {/* Clear row */}
      {isFiltered && (
        <div className="flex justify-end border-t border-line pt-2.5">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-medium text-foreground-muted transition-colors hover:text-danger"
          >
            <XIcon className="h-3.5 w-3.5" />
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
}

//  Icons

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
