"use client";

import { useEffect, useRef, useState } from "react";

// ─── Column definitions ───────────────────────────────────────────────────────

export const COLUMN_DEFS = [
  { key: "orderNumber", label: "#Pedido" },
  { key: "customer", label: "Cliente" },
  { key: "whatsapp", label: "Telefone" },
  { key: "products", label: "Produtos" },
  { key: "itemCount", label: "Qtd. itens" },
  { key: "totalAmount", label: "Valor total" },
  { key: "deliveryDate", label: "Data entrega" },
  { key: "createdAt", label: "Data pedido" },
  { key: "status", label: "Status" },
  { key: "fulfillment", label: "Tipo" },
] as const;

export type ColumnKey = (typeof COLUMN_DEFS)[number]["key"];

export type VisibleColumns = Record<ColumnKey, boolean>;

// ─── localStorage helpers ─────────────────────────────────────────────────────

const LS_KEY = "dashboard_orders_visible_columns";

export function loadVisibleColumns(): VisibleColumns {
  const defaults: VisibleColumns = Object.fromEntries(
    COLUMN_DEFS.map((c) => [c.key, true]),
  ) as VisibleColumns;

  if (typeof window === "undefined") return defaults;

  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<VisibleColumns>;
    // Merge with defaults so newly added columns appear as visible
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

function saveVisibleColumns(cols: VisibleColumns) {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(cols));
  } catch {
    // ignore quota / private-mode errors
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ColumnSelectorProps {
  value: VisibleColumns;
  onChange: (next: VisibleColumns) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ColumnSelector — a popover with checkboxes for toggling visible columns.
 *
 * Opens on button click and closes when clicking outside. Persists selection
 * to localStorage under `dashboard_orders_visible_columns`.
 */
export function ColumnSelector({ value, onChange }: ColumnSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function toggle(key: ColumnKey) {
    const next = { ...value, [key]: !value[key] };
    onChange(next);
    saveVisibleColumns(next);
  }

  const visibleCount = Object.values(value).filter(Boolean).length;

  return (
    <div ref={ref} className="relative shrink-0">
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className={[
          "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium",
          "transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40",
          open
            ? "border-accent bg-accent/5 text-accent"
            : "border-line bg-surface text-foreground hover:bg-surface-hover",
        ].join(" ")}
      >
        {/* Columns icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M.99 5.24A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25l.01 9.5A2.25 2.25 0 0 1 16.76 17H3.26A2.267 2.267 0 0 1 1 14.74l-.01-9.5Zm8.26 9.52v-.625a.75.75 0 0 0-1.5 0v.375H3.26a.75.75 0 0 1-.76-.77l-.01-9.5a.75.75 0 0 1 .75-.75h4.5v10.625Zm1.5 0V5.373h4.5a.75.75 0 0 1 .75.75l.01 9.5a.755.755 0 0 1-.75.769h-4.51v-.872Z"
            clipRule="evenodd"
          />
        </svg>
        Colunas
        {/* Count badge */}
        <span className="rounded-full bg-surface-hover px-1.5 py-0.5 text-xs tabular-nums text-foreground-muted">
          {visibleCount}/{COLUMN_DEFS.length}
        </span>
      </button>

      {/* Popover */}
      {open && (
        <div
          role="menu"
          className={[
            "absolute right-0 top-full z-20 mt-1 w-52",
            "rounded-xl border border-line bg-surface shadow-lg",
            "p-2",
          ].join(" ")}
        >
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-widest text-foreground-muted">
            Colunas visíveis
          </p>
          <ul className="space-y-0.5">
            {COLUMN_DEFS.map((col) => (
              <li key={col.key}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-hover">
                  <input
                    type="checkbox"
                    checked={value[col.key]}
                    onChange={() => toggle(col.key)}
                    className="h-4 w-4 rounded border-line accent-accent"
                  />
                  <span className="text-sm text-foreground">{col.label}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
