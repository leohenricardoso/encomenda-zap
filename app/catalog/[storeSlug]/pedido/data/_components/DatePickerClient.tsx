"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  readCart,
  writeCart,
  setDeliveryDate,
  setFulfillmentType,
  setShippingCep,
  setPickupSlot,
} from "../../../_lib/cart";
import { Button } from "../../../../../_components/Button";
import { Card } from "../../../../../_components/Card";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DayEntry {
  date: string; // YYYY-MM-DD
  isOpen: boolean;
}

interface PickupSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
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

/** Strip non-digit chars and return up to 8 digits. */
function rawCepDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 8);
}

/** Format 8-digit raw CEP as XXXXX-XXX for display. */
function formatCep(digits: string): string {
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/** Apply CEP mask to a raw input event value. */
function applyCepMask(value: string): string {
  return formatCep(rawCepDigits(value));
}

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
  const [fulfillmentType, setFulfillment] = useState<"pickup" | "delivery">(
    "pickup",
  );
  const [cep, setCep] = useState(""); // masked display value e.g. "01310-000"
  const [cepStatus, setCepStatus] = useState<
    "idle" | "validating" | "valid" | "invalid" | "error"
  >("idle");
  // Pickup slots
  const [pickupSlots, setPickupSlots] = useState<PickupSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [pickupSlotId, setPickupSlotId] = useState<string | null>(null);

  // Hydrate: read existing state from cart & guard empty cart
  useEffect(() => {
    const cart = readCart();
    if (!cart || cart.storeSlug !== storeSlug || cart.items.length === 0) {
      router.replace(`/catalog/${storeSlug}`);
      return;
    }
    // Restore any previously chosen fulfillment type (old carts default to pickup)
    if (cart.fulfillmentType) setFulfillment(cart.fulfillmentType);
    if (cart.shippingCep) {
      setCep(formatCep(cart.shippingCep.replace(/\D/g, "")));
      // Treat previously-saved CEP as already valid
      setCepStatus("valid");
    }
    if (cart.pickupSlotId) setPickupSlotId(cart.pickupSlotId);
    if (cart.deliveryDate) {
      // Re-select if still in available list
      const stillAvailable = days.some(
        (d) => d.date === cart.deliveryDate && d.isOpen,
      );
      if (stillAvailable) setSelected(cart.deliveryDate);
    }
    setHydrated(true);
  }, [storeSlug, days, router]);

  // Fetch pickup slots whenever selected date or fulfillment type change
  useEffect(() => {
    if (fulfillmentType !== "pickup" || !selected) {
      setPickupSlots([]);
      // Only clear the chosen slot when the date changes (not when restoring from cart)
      setPickupSlotId(null);
      return;
    }
    const dow = parseUtcDate(selected).getUTCDay();
    let cancelled = false;
    setSlotsLoading(true);
    fetch(`/api/catalog/${storeSlug}/pickup-slots?dayOfWeek=${dow}`)
      .then((r) => r.json() as Promise<{ success: boolean; data: { slots: PickupSlot[] } }>)
      .then(({ data: { slots } }) => {
        if (cancelled) return;
        setPickupSlots(slots.filter((s) => s.isActive));
        // Keep previously chosen slot only if it's still valid for this day
        setPickupSlotId((prev) =>
          slots.some((s) => s.id === prev && s.isActive) ? prev : null,
        );
      })
      .catch(() => {
        if (!cancelled) setPickupSlots([]);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selected, fulfillmentType, storeSlug]);

  // ── CEP blur handler ──────────────────────────────────────────────────────
  async function handleCepBlur() {
    const digits = rawCepDigits(cep);
    if (digits.length !== 8) {
      // Only validate when 8 digits entered; leave idle if shorter
      if (digits.length > 0) setCepStatus("invalid");
      return;
    }
    setCepStatus("validating");
    try {
      const res = await fetch(
        `/api/catalog/${storeSlug}/validate-cep?cep=${digits}`,
      );
      const json = (await res.json()) as {
        success?: boolean;
        data?: { valid: boolean; unrestricted: boolean };
        error?: string;
      };
      if (!res.ok || !json.success) {
        setCepStatus("error");
        return;
      }
      setCepStatus(json.data!.valid ? "valid" : "invalid");
    } catch {
      setCepStatus("error");
    }
  }

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
    if (fulfillmentType === "delivery" && cepStatus !== "valid") return;
    if (fulfillmentType === "pickup" && !pickupSlotId) return;
    const cart = readCart();
    if (!cart) return;
    let updated = setDeliveryDate(cart, selected);
    updated = setFulfillmentType(updated, fulfillmentType);
    // Store raw 8-digit CEP (no mask) in cart
    updated = setShippingCep(
      updated,
      fulfillmentType === "delivery" ? rawCepDigits(cep) : null,
    );
    const slot = pickupSlots.find((s) => s.id === pickupSlotId) ?? null;
    updated = setPickupSlot(
      updated,
      fulfillmentType === "pickup" ? (pickupSlotId ?? null) : null,
      fulfillmentType === "pickup" && slot
        ? `${slot.startTime} – ${slot.endTime}`
        : null,
    );
    writeCart(updated);
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

  // ── Derived for continue button ─────────────────────────────────────────────
  const canContinue =
    !!selected &&
    (fulfillmentType === "pickup" ? !!pickupSlotId : cepStatus === "valid");

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
              Pedido
            </h1>
            <p className="text-sm text-foreground-muted">
              Como quer receber seu pedido de{" "}
              <span className="font-medium text-foreground">{storeName}</span>?
            </p>
          </div>
        </div>

        {/* ── Fulfillment toggle ──────────────────────────────────────────────── */}
        <div
          role="radiogroup"
          aria-label="Tipo de recebimento"
          className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-surface-subtle p-1"
        >
          {(["pickup", "delivery"] as const).map((type) => {
            const isActive = fulfillmentType === type;
            return (
              <button
                key={type}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => setFulfillment(type)}
                className={[
                  "flex items-center justify-center gap-2 rounded-lg px-4 py-3",
                  "text-sm font-medium transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
                  isActive
                    ? "bg-gray-200 border-2 border-black shadow-md ring-1 ring-accent/50"
                    : "text-foreground-muted hover:text-foreground hover:bg-surface-hover",
                ].join(" ")}
              >
                {type === "pickup" ? (
                  <StoreIcon className="h-4 w-4 shrink-0" />
                ) : (
                  <TruckIcon className="h-4 w-4 shrink-0" />
                )}
                {type === "pickup" ? "Retirada" : "Entrega"}
              </button>
            );
          })}
        </div>

        {/* ── CEP field — delivery only (no format validation yet) ────────────── */}
        <div
          className={[
            "overflow-hidden transition-all duration-300 ease-in-out",
            fulfillmentType === "delivery"
              ? "max-h-40 opacity-100"
              : "max-h-0 opacity-0 pointer-events-none",
          ].join(" ")}
          aria-hidden={fulfillmentType !== "delivery"}
        >
          <div className="rounded-xl border border-line bg-surface p-4 space-y-2">
            <label
              htmlFor="cep"
              className="block text-sm font-medium text-foreground"
            >
              CEP de entrega
            </label>
            <div className="relative mt-1">
              <input
                id="cep"
                type="text"
                inputMode="numeric"
                placeholder="00000-000"
                maxLength={9}
                value={cep}
                onChange={(e) => {
                  setCep(applyCepMask(e.target.value));
                  // Reset validation when user edits
                  if (cepStatus !== "idle") setCepStatus("idle");
                }}
                onBlur={handleCepBlur}
                tabIndex={fulfillmentType === "delivery" ? 0 : -1}
                className={[
                  "w-full rounded-lg border px-3 py-2.5 pr-9 text-sm",
                  "bg-surface-subtle text-foreground placeholder:text-foreground-muted",
                  "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent",
                  "transition-colors duration-150",
                  cepStatus === "invalid" || cepStatus === "error"
                    ? "border-danger focus:ring-danger focus:border-danger"
                    : cepStatus === "valid"
                      ? "border-green-500 focus:ring-green-500 focus:border-green-500"
                      : "border-line",
                ].join(" ")}
              />
              {/* Inline status icon */}
              <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
                {cepStatus === "validating" && (
                  <SpinnerIcon className="h-4 w-4 animate-spin text-foreground-muted" />
                )}
                {cepStatus === "valid" && (
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                )}
                {(cepStatus === "invalid" || cepStatus === "error") && (
                  <XCircleIcon className="h-4 w-4 text-danger" />
                )}
              </div>
            </div>
            {/* Validation feedback text */}
            {cepStatus === "valid" && (
              <p className="flex items-center gap-1 text-xs text-green-600 mt-1">
                <CheckCircleIcon className="h-3.5 w-3.5 shrink-0" />
                CEP atendido
              </p>
            )}
            {cepStatus === "invalid" && (
              <p className="flex items-center gap-1 text-xs text-danger mt-1">
                <XCircleIcon className="h-3.5 w-3.5 shrink-0" />
                CEP não atendido pela loja
              </p>
            )}
            {cepStatus === "error" && (
              <p className="flex items-center gap-1 text-xs text-danger mt-1">
                <XCircleIcon className="h-3.5 w-3.5 shrink-0" />
                Erro ao validar — tente novamente
              </p>
            )}
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
                              "text-sm font-medium select-none transition-all duration-150",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
                              // State styles
                              isSelected
                                ? "bg-gray-200 border-2 border-black font-bold shadow-md ring-2 ring-accent ring-offset-1"
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
        {/* ── Pickup slot picker ──────────────────────────────────────────────── */}
        {fulfillmentType === "pickup" && selected && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-foreground-muted shrink-0" />
              <p className="text-sm font-semibold text-foreground">
                Horário de retirada
              </p>
            </div>

            {slotsLoading ? (
              // Skeleton
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-12 rounded-xl bg-surface-hover animate-pulse"
                  />
                ))}
              </div>
            ) : pickupSlots.length === 0 ? (
              <div className="rounded-xl border border-line bg-surface px-4 py-4 text-center text-sm text-foreground-muted">
                Nenhum horário disponível para esta data.
              </div>
            ) : (
              <div
                role="radiogroup"
                aria-label="Horário de retirada"
                className="grid grid-cols-2 gap-2"
              >
                {pickupSlots.map((slot) => {
                  const isChosen = pickupSlotId === slot.id;
                  const label = `${slot.startTime} – ${slot.endTime}`;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      role="radio"
                      aria-checked={isChosen}
                      onClick={() =>
                        setPickupSlotId((prev) =>
                          prev === slot.id ? null : slot.id,
                        )
                      }
                      className={[
                        "relative flex flex-col items-center justify-center gap-0.5",
                        "rounded-xl border px-3 py-3.5 text-sm font-semibold",
                        "transition-all duration-150 cursor-pointer",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
                        isChosen
                          ? "bg-gray-200 border-2 border-black shadow-md ring-2 ring-accent ring-offset-1"
                          : "bg-surface text-foreground border-line hover:border-accent/40 hover:bg-accent/5",
                      ].join(" ")}
                    >
                      {isChosen && (
                        <span className="absolute top-1.5 right-1.5">
                          <CheckCircleIcon className="h-3.5 w-3.5" />
                        </span>
                      )}
                      <span className="tabular-nums tracking-tight text-base">
                        {slot.startTime}
                      </span>
                      <span className="text-[11px] font-normal opacity-80">
                        até {slot.endTime}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
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
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 shrink-0 text-accent" />
                  <span className="capitalize leading-snug font-medium">
                    {selectedLabel}
                  </span>
                </div>
                {fulfillmentType === "pickup" &&
                  pickupSlotId &&
                  (() => {
                    const slot = pickupSlots.find((s) => s.id === pickupSlotId);
                    return slot ? (
                      <div className="flex items-center gap-2 pl-6">
                        <ClockIcon className="h-3.5 w-3.5 shrink-0 text-accent" />
                        <span className="text-xs text-accent font-medium">
                          {slot.startTime} – {slot.endTime}
                        </span>
                      </div>
                    ) : null;
                  })()}
                {fulfillmentType === "delivery" && cep && (
                  <div className="flex items-center gap-2 pl-6">
                    <TruckIcon className="h-3.5 w-3.5 shrink-0 text-foreground-muted" />
                    <span className="text-xs text-foreground-muted">
                      CEP:{" "}
                      <span className="font-medium text-foreground">{cep}</span>
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center">Nenhuma data selecionada</p>
            )}
          </div>

          <Button
            variant="primary"
            size="lg"
            disabled={!canContinue}
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

function StoreIcon({ className }: { className?: string }) {
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
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function TruckIcon({ className }: { className?: string }) {
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
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function XCircleIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
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
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
