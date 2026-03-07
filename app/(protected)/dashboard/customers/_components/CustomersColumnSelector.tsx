"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ─── Column definitions ───────────────────────────────────────────────────────

const COLUMN_DEFS = [
  { key: "name", label: "Nome" },
  { key: "whatsapp", label: "Telefone" },
  { key: "ordersCount", label: "Pedidos" },
  { key: "totalSpent", label: "Valor total" },
  { key: "avgTicket", label: "Ticket médio" },
  { key: "firstOrder", label: "Primeiro pedido" },
  { key: "lastOrder", label: "Último pedido" },
] as const;

export type CustomerColumnKey = (typeof COLUMN_DEFS)[number]["key"];
export type CustomerVisibleColumns = Record<CustomerColumnKey, boolean>;

const LS_KEY = "dashboard_customers_visible_columns";

const ALL_VISIBLE: CustomerVisibleColumns = Object.fromEntries(
  COLUMN_DEFS.map((c) => [c.key, true]),
) as CustomerVisibleColumns;

// ─── Local storage helpers ────────────────────────────────────────────────────

export function loadCustomerVisibleColumns(): CustomerVisibleColumns {
  if (typeof window === "undefined") return { ...ALL_VISIBLE };
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { ...ALL_VISIBLE };
    const parsed = JSON.parse(raw) as Partial<CustomerVisibleColumns>;
    // Ensure all keys exist (new columns default to visible)
    return Object.fromEntries(
      COLUMN_DEFS.map((c) => [c.key, parsed[c.key] ?? true]),
    ) as CustomerVisibleColumns;
  } catch {
    return { ...ALL_VISIBLE };
  }
}

export function saveCustomerVisibleColumns(cols: CustomerVisibleColumns): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(cols));
  } catch {
    // quota exceeded — silently ignore
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CustomersColumnSelectorProps {
  visibleColumns: CustomerVisibleColumns;
  onChange: (cols: CustomerVisibleColumns) => void;
}

export function CustomersColumnSelector({
  visibleColumns,
  onChange,
}: CustomersColumnSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  const handleOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleOutside);
    } else {
      document.removeEventListener("mousedown", handleOutside);
    }
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open, handleOutside]);

  function toggle(key: CustomerColumnKey) {
    const next = { ...visibleColumns, [key]: !visibleColumns[key] };
    onChange(next);
    saveCustomerVisibleColumns(next);
  }

  const visibleCount = Object.values(visibleColumns).filter(Boolean).length;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          "flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2",
          "text-sm text-foreground-muted transition-colors hover:bg-surface-hover",
        ].join(" ")}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z"
            clipRule="evenodd"
          />
        </svg>
        Colunas
        <span className="rounded-full bg-surface-hover px-1.5 py-0.5 text-xs tabular-nums">
          {visibleCount}/{COLUMN_DEFS.length}
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          className={[
            "absolute right-0 z-20 mt-1 min-w-[180px] rounded-xl border border-line bg-surface p-2 shadow-lg",
          ].join(" ")}
        >
          {COLUMN_DEFS.map((col) => (
            <label
              key={col.key}
              className={[
                "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2",
                "text-sm text-foreground hover:bg-surface-hover",
              ].join(" ")}
            >
              <input
                type="checkbox"
                checked={visibleColumns[col.key]}
                onChange={() => toggle(col.key)}
                className="accent-accent"
              />
              {col.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
