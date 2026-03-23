"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { OrderStatus } from "@/domain/order/Order";
import { STATUS_CONFIG } from "../../_components/StatusBadge";
import { Button } from "../../../../_components/Button";

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

const STATUS_OPTIONS: { value: OrderStatus | ""; label: string }[] = [
  { value: "", label: "Pendentes + Aceitas" },
  ...Object.values(OrderStatus).map((s) => ({
    value: s,
    label: STATUS_CONFIG[s].label,
  })),
];

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * OrdersFilters — filter controls for the orders listing table.
 *
 * All state lives in the URL (searchParams) so filters survive page refresh,
 * deep-linking, and browser back/forward navigation.
 *
 * Params:
 *   from    YYYY-MM-DD  delivery date start
 *   to      YYYY-MM-DD  delivery date end
 *   status  PENDING | APPROVED | REJECTED
 *   search  free text — customer name or phone
 *   page    (reset to 1 on any filter change)
 */
export function OrdersFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const raw = useCallback((k: string) => searchParams.get(k), [searchParams]);

  // ── Draft state — local form values (not applied yet) ─────────────────────
  const [draftFrom, setDraftFrom] = useState(raw("from") ?? "");
  const [draftTo, setDraftTo] = useState(raw("to") ?? "");
  const [draftStatus, setDraftStatus] = useState(raw("status") ?? "");
  const [draftSearch, setDraftSearch] = useState(raw("search") ?? "");

  // activePreset derives from draft values (reflects form state)
  const activePreset = detectPreset(draftFrom || null, draftTo || null);

  // isFiltered reflects what's currently applied in the URL
  const isFiltered = !!(
    raw("from") ||
    raw("to") ||
    raw("status") ||
    raw("search")
  );

  // ── Apply all drafts to URL at once ───────────────────────────────────────

  function applyFilters() {
    // Start from current search params so unrelated params (e.g. limit) are preserved
    const next = new URLSearchParams(searchParams.toString());
    if (draftFrom) next.set("from", draftFrom);
    else next.delete("from");
    if (draftTo) next.set("to", draftTo);
    else next.delete("to");
    if (draftStatus) next.set("status", draftStatus);
    else next.delete("status");
    const trimmed = draftSearch.trim();
    if (trimmed) next.set("search", trimmed);
    else next.delete("search");
    next.delete("page");
    router.push(`?${next.toString()}`, { scroll: false });
  }

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleDatePreset(preset: DatePreset) {
    const t = todayStr();
    const tm = tomorrowStr();
    if (preset === "tudo") {
      setDraftFrom("");
      setDraftTo("");
    } else if (preset === "hoje") {
      setDraftFrom(t);
      setDraftTo(t);
    } else if (preset === "amanha") {
      setDraftFrom(tm);
      setDraftTo(tm);
    } else {
      setDraftFrom(t);
      setDraftTo("");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") applyFilters();
  }

  function handleReset() {
    setDraftFrom("");
    setDraftTo("");
    setDraftStatus("");
    setDraftSearch("");
    // Preserve unrelated params (e.g. limit) — only clear filter + page params
    const next = new URLSearchParams(searchParams.toString());
    ["from", "to", "status", "search", "page"].forEach((k) => next.delete(k));
    const qs = next.toString();
    router.push(qs ? `?${qs}` : "?", { scroll: false });
  }

  // ─── Styles ────────────────────────────────────────────────────────────────

  const presetBase =
    "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40";
  const presetActive = "text-accent-foreground border-accent";
  const presetInactive =
    "bg-surface text-foreground-muted border-line hover:bg-surface-hover";

  const inputBase = [
    "h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm",
    "text-foreground placeholder:text-foreground-muted/60",
    "focus:outline-none focus:ring-2 focus:ring-accent/40",
  ].join(" ");

  return (
    <div className="space-y-3 rounded-xl border border-line bg-surface p-4 shadow-sm">
      {/* ── Row 1: Date presets ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 shrink-0 text-xs font-semibold uppercase tracking-widest text-foreground-muted">
          Data
        </span>
        {DATE_PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => handleDatePreset(p.key)}
            className={[
              presetBase,
              activePreset === p.key ? presetActive : presetInactive,
            ].join(" ")}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ── Row 2: Custom date range (only shown in "periodo" mode) ──────── */}
      {activePreset === "periodo" && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="shrink-0 text-xs font-semibold uppercase tracking-widest text-foreground-muted">
            De / Até
          </span>
          <input
            type="date"
            value={draftFrom}
            onChange={(e) => setDraftFrom(e.target.value)}
            className={`${inputBase} max-w-40`}
            aria-label="Data de entrega — início"
          />
          <span className="text-foreground-muted" aria-hidden="true">
            →
          </span>
          <input
            type="date"
            value={draftTo}
            onChange={(e) => setDraftTo(e.target.value)}
            className={`${inputBase} max-w-40`}
            aria-label="Data de entrega — fim"
          />
        </div>
      )}

      {/* ── Row 3: Status + search ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status select */}
        <select
          value={draftStatus}
          onChange={(e) => setDraftStatus(e.target.value)}
          className={`${inputBase} max-w-50 cursor-pointer`}
          aria-label="Filtrar por status"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Customer search */}
        <div className="relative flex-1 min-w-50">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                clipRule="evenodd"
              />
            </svg>
          </span>
          <input
            type="search"
            placeholder="Buscar cliente ou telefone…"
            value={draftSearch}
            onChange={(e) => setDraftSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`${inputBase} pl-9`}
            aria-label="Buscar cliente por nome ou telefone"
          />
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" size="sm" onClick={applyFilters}>
            Filtrar
          </Button>
          {isFiltered && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-foreground-muted transition-colors hover:bg-surface-hover"
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
              Limpar filtros
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
