"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { OrderStatus } from "@/domain/order/Order";
import { STATUS_CONFIG } from "./StatusBadge";
import { parseFilters } from "../_lib/filters";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowStr() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

// ─── Date presets ─────────────────────────────────────────────────────────────

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

// ─── Status options ───────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: OrderStatus | null; label: string }[] = [
  { value: null, label: "Todos" },
  ...Object.values(OrderStatus).map((s) => ({
    value: s,
    label: STATUS_CONFIG[s].label,
  })),
];

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * FilterBar — compact, mobile-friendly filter strip for the orders dashboard.
 *
 * URL params (all optional — omit to use default):
 *   from    YYYY-MM-DD  start of date range
 *   to      YYYY-MM-DD  end of date range
 *   status  PENDING | APPROVED | REJECTED
 *
 * Default state (no params): all orders from today onwards, all statuses.
 */
export function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { from, to, status } = parseFilters(
    Object.fromEntries(searchParams.entries()),
  );

  const activePreset = detectPreset(from, to);
  const isFiltered = !!(from || to || status);

  // ── URL updater ─────────────────────────────────────────────────────────────

  function push(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    // Preserve scroll position — replace only query string.
    router.push(`?${next.toString()}`, { scroll: false });
  }

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleDatePreset(preset: DatePreset) {
    const t = todayStr();
    const tm = tomorrowStr();
    if (preset === "tudo") push({ from: null, to: null });
    else if (preset === "hoje") push({ from: t, to: t });
    else if (preset === "amanha") push({ from: tm, to: tm });
    // "periodo" → only clear to so user fills date inputs
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
    router.push("?", { scroll: false });
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* ── Row 1: Date presets ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-semibold uppercase tracking-widest text-foreground-muted shrink-0">
          Data
        </span>
        {DATE_PRESETS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => handleDatePreset(key)}
            className={[
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              activePreset === key
                ? "bg-foreground text-surface"
                : "bg-surface-hover text-foreground-muted hover:text-foreground",
            ].join(" ")}
          >
            {label}
          </button>
        ))}

        {/* Reset pill */}
        {isFiltered && (
          <button
            type="button"
            onClick={handleReset}
            className="ml-auto flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-foreground-muted hover:text-danger transition-colors"
            aria-label="Limpar filtros"
          >
            <XIcon className="h-3.5 w-3.5" />
            Limpar
          </button>
        )}
      </div>

      {/* ── Date inputs (Período only) ─────────────────────────────────────── */}
      {activePreset === "periodo" && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-foreground-muted shrink-0 w-8" />
          <label className="flex items-center gap-1.5 text-xs text-foreground-muted">
            De
            <input
              type="date"
              value={from ?? ""}
              onChange={(e) => handleFrom(e.target.value)}
              className="rounded-lg border border-line bg-surface px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-foreground-muted">
            Até
            <input
              type="date"
              value={to ?? ""}
              min={from ?? undefined}
              onChange={(e) => handleTo(e.target.value)}
              className="rounded-lg border border-line bg-surface px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>
        </div>
      )}

      {/* ── Row 2: Status chips ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-semibold uppercase tracking-widest text-foreground-muted shrink-0">
          Status
        </span>
        {STATUS_OPTIONS.map(({ value, label }) => {
          const isActive = status === value;
          // Use per-status colour when active (matches badge colours)
          const activeClass =
            value === null
              ? "bg-foreground text-surface"
              : value === OrderStatus.PENDING
                ? "bg-amber-400 text-amber-900"
                : value === OrderStatus.APPROVED
                  ? "bg-green-600 text-white"
                  : "bg-surface-hover text-foreground border border-line";
          return (
            <button
              key={value ?? "all"}
              type="button"
              onClick={() => handleStatus(value)}
              className={[
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                isActive
                  ? activeClass
                  : "bg-surface-hover text-foreground-muted hover:text-foreground",
              ].join(" ")}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Icon ─────────────────────────────────────────────────────────────────────

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
