"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { readCart, writeCart, setDeliveryDate } from "../../../_lib/cart";
import { Button } from "../../../../../_components/Button";
import { Card } from "../../../../../_components/Card";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DayEntry {
  date: string; // YYYY-MM-DD
  isOpen: boolean;
}

interface CalendarCell {
  day: DayEntry | null; // null = padding cell
}

interface WeekRow {
  /** Key for React: "yyyy-MM-WW" */
  key: string;
  cells: CalendarCell[];
  /** Month label to render above this row (e.g. "Março 2026") */
  monthLabel: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DOW_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

/** Parse a YYYY-MM-DD string as UTC midnight, returns a Date. */
function parseUtcDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

/**
 * Format a YYYY-MM-DD date as a friendly label, e.g.:
 *   "sexta-feira, 27 de março de 2026"
 */
function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  // Use local calendar display (not UTC) for the label — avoids "wrong day" on BR TZ
  return new Date(
    y as number,
    (m as number) - 1,
    d as number,
  ).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Build calendar week rows from a flat sorted list of DayEntry.
 * Pads the first row with nulls to align Sunday = column 0.
 */
function buildWeekRows(days: DayEntry[]): WeekRow[] {
  if (days.length === 0) return [];

  const first = parseUtcDate(days[0].date);
  const startPad = first.getUTCDay(); // 0=Sun…6=Sat

  const paddedCells: (DayEntry | null)[] = [
    ...Array(startPad).fill(null),
    ...days,
  ];

  // Pad end to fill last week
  const remainder = paddedCells.length % 7;
  if (remainder !== 0) {
    for (let i = 0; i < 7 - remainder; i++) paddedCells.push(null);
  }

  const rows: WeekRow[] = [];
  for (let i = 0; i < paddedCells.length; i += 7) {
    const chunk = paddedCells.slice(i, i + 7);

    // Month label: first real cell in this row that starts a new month
    let monthLabel: string | null = null;
    for (const cell of chunk) {
      if (!cell) continue;
      const cellMonthKey = cell.date.slice(0, 7); // "yyyy-MM"

      if (rows.length === 0) {
        // Always show label on the first row
        const d = parseUtcDate(cell.date);
        monthLabel = `${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
        break;
      }

      // Compare with last row's last real cell
      const prevRow = rows[rows.length - 1]!;
      const prevLastDate = [...prevRow.cells]
        .reverse()
        .find((c) => c.day !== null)?.day?.date;

      if (!prevLastDate || prevLastDate.slice(0, 7) !== cellMonthKey) {
        const d = parseUtcDate(cell.date);
        monthLabel = `${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
      }
      break;
    }

    rows.push({
      key: `week-${i}`,
      cells: chunk.map((d) => ({ day: d })),
      monthLabel,
    });
  }

  return rows;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface DatePickerClientProps {
  storeSlug: string;
  storeName: string;
  days: DayEntry[];
}

/**
 * DatePickerClient
 *
 * Client Component for the /pedido/data step.
 *
 * Responsibilities:
 * 1. Redirect to catalog when cart is empty.
 * 2. Pre-select deliveryDate already stored in cart (back-navigation UX).
 * 3. Render a calendar grid — open days selectable, closed days disabled.
 * 4. Persist the selected date to the cart (sessionStorage) on "Continuar".
 * 5. Navigate to /pedido/revisar.
 */
export function DatePickerClient({
  storeSlug,
  storeName,
  days,
}: DatePickerClientProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate: read existing deliveryDate from cart & guard empty cart
  useEffect(() => {
    const cart = readCart();
    if (!cart || cart.storeSlug !== storeSlug || cart.items.length === 0) {
      router.replace(`/catalog/${storeSlug}`);
      return;
    }
    if (cart.deliveryDate) {
      // Re-select if still in available list
      const stillAvailable = days.some(
        (d) => d.date === cart.deliveryDate && d.isOpen,
      );
      if (stillAvailable) setSelected(cart.deliveryDate);
    }
    setHydrated(true);
  }, [storeSlug, days, router]);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const openDates = new Set(days.filter((d) => d.isOpen).map((d) => d.date));
  const hasAnyOpen = openDates.size > 0;
  const weeks = buildWeekRows(days);

  const selectedLabel = selected ? formatLongDate(selected) : null;

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function handleSelect(date: string) {
    setSelected((prev) => (prev === date ? null : date));
  }

  function handleContinue() {
    if (!selected) return;
    const cart = readCart();
    if (!cart) return;
    writeCart(setDeliveryDate(cart, selected));
    router.push(`/catalog/${storeSlug}/pedido/revisar`);
  }

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (!hydrated) {
    return (
      <div className="min-h-dvh bg-surface-subtle flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-foreground" />
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────────
  if (!hasAnyOpen) {
    return (
      <div className="min-h-dvh bg-surface-subtle flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-100 text-center space-y-4">
          <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-xl bg-surface-hover">
            <CalendarIcon className="h-7 w-7 text-foreground-muted" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-foreground">
              Sem datas disponíveis
            </h1>
            <p className="text-sm text-foreground-muted">
              {storeName} não tem datas abertas para pedidos nos próximos 30
              dias. Tente novamente mais tarde.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/catalog/${storeSlug}`)}
            className="text-sm text-accent hover:underline"
          >
            ← Voltar ao catálogo
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh bg-surface-subtle flex flex-col items-center justify-start px-4 py-10">
      <div className="w-full max-w-120 space-y-6">
        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface shadow-sm border border-line">
            <CalendarIcon className="h-6 w-6 text-foreground" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Escolha a data
            </h1>
            <p className="text-sm text-foreground-muted">
              Selecione quando quer receber o pedido de{" "}
              <span className="font-medium text-foreground">{storeName}</span>.
            </p>
          </div>
        </div>

        {/* ── Calendar card ──────────────────────────────────────────────────── */}
        <Card>
          <div className="flex flex-col gap-4">
            {/* Day-of-week headers */}
            <div
              className="grid grid-cols-7 gap-1"
              role="row"
              aria-hidden="true"
            >
              {DOW_LABELS.map((label) => (
                <div
                  key={label}
                  className="text-center text-[10px] font-semibold uppercase tracking-wide text-foreground-muted py-1"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Week rows */}
            <div
              role="grid"
              aria-label="Calendário de datas disponíveis"
              className="flex flex-col gap-1"
            >
              {weeks.map((week) => (
                <div key={week.key}>
                  {/* Month label — rendered when month boundary crosses */}
                  {week.monthLabel && (
                    <p
                      aria-hidden="true"
                      className="text-xs font-semibold text-foreground-muted uppercase tracking-widest mt-2 mb-1 pl-1"
                    >
                      {week.monthLabel}
                    </p>
                  )}
                  <div role="row" className="grid grid-cols-7 gap-1">
                    {week.cells.map((cell, idx) => {
                      if (!cell.day) {
                        return (
                          <div
                            key={`pad-${week.key}-${idx}`}
                            role="gridcell"
                            aria-hidden="true"
                          />
                        );
                      }

                      const { date, isOpen } = cell.day;
                      const isSelected = selected === date;
                      const dayNum = parseInt(date.slice(8, 10), 10);

                      return (
                        <div key={date} role="gridcell">
                          <button
                            type="button"
                            aria-label={`${isOpen ? "Selecionar" : "Indisponível"}: ${formatLongDate(date)}`}
                            aria-pressed={isSelected}
                            aria-disabled={!isOpen}
                            disabled={!isOpen}
                            onClick={() => isOpen && handleSelect(date)}
                            className={[
                              // Shape and size — square tap target
                              "w-full aspect-square rounded-lg flex items-center justify-center",
                              "text-sm font-medium select-none transition-colors duration-100",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
                              // State styles
                              isSelected
                                ? "bg-accent text-white shadow-sm"
                                : isOpen
                                  ? "bg-surface text-foreground border border-line hover:bg-accent/10 hover:border-accent/40 cursor-pointer"
                                  : "bg-surface-subtle text-foreground-muted cursor-not-allowed opacity-40 line-through",
                            ].join(" ")}
                          >
                            {dayNum}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 pt-1 border-t border-line">
              <div className="flex items-center gap-1.5">
                <div className="h-3.5 w-3.5 rounded bg-accent" />
                <span className="text-xs text-foreground-muted">
                  Selecionado
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3.5 w-3.5 rounded border border-line bg-surface" />
                <span className="text-xs text-foreground-muted">
                  Disponível
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3.5 w-3.5 rounded bg-surface-subtle opacity-40" />
                <span className="text-xs text-foreground-muted">
                  Indisponível
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Selection summary + CTA ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          {/* Selected date preview */}
          <div
            aria-live="polite"
            aria-atomic="true"
            className={[
              "rounded-xl border px-4 py-3 text-sm transition-all duration-200",
              selected
                ? "border-accent/30 bg-accent/5 text-foreground"
                : "border-line bg-surface text-foreground-muted",
            ].join(" ")}
          >
            {selected ? (
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-4 w-4 shrink-0 text-accent" />
                <span className="capitalize leading-snug">{selectedLabel}</span>
              </div>
            ) : (
              <p className="text-center">Nenhuma data selecionada</p>
            )}
          </div>

          <Button
            variant="primary"
            size="lg"
            disabled={!selected}
            onClick={handleContinue}
          >
            Continuar →
          </Button>

          <Button
            variant="ghost"
            size="md"
            onClick={() => router.push(`/catalog/${storeSlug}`)}
          >
            ← Voltar ao catálogo
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
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
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}
