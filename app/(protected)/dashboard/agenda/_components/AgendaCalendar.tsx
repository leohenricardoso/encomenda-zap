"use client";

/**
 * AgendaCalendar — interactive monthly calendar for store schedule management.
 *
 * UX rules:
 * ─ Past days are displayed but non-interactive (opacity-40).
 * ─ Future days are clickable; clicking toggles open/closed.
 * ─ Optimistic updates: the UI updates immediately; reverted on error.
 * ─ Month navigation: min = current month (no editing past months needed).
 * ─ An accent dot marks days that have been manually overridden.
 *
 * Color conventions:
 * ─ Open   (default)  : green-50 bg, subtle green border
 * ─ Open   (override) : green-100 bg, stronger green border
 * ─ Closed (default)  : surface-subtle bg, muted (Sat/Sun)
 * ─ Closed (override) : red-50 bg, red border (admin explicitly closed)
 *
 * API contract:
 * ─ GET  /api/schedule?from=YYYY-MM-DD&to=YYYY-MM-DD → { success, data: { days } }
 * ─ PATCH /api/schedule/:date  { isOpen: boolean }   → { success, data: { day } }
 */

import { useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScheduleDay {
  date: string; // YYYY-MM-DD
  isOpen: boolean;
  isDefault: boolean;
  isEditable: boolean;
}

interface AgendaCalendarProps {
  initialDays: ScheduleDay[];
  initialYear: number;
  initialMonth: number; // 0-based (0 = January)
}

// ─── Constants ────────────────────────────────────────────────────────────────

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

// Brazilian calendar starts on Sunday
const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function firstDayStr(year: number, month: number): string {
  return `${year}-${pad2(month + 1)}-01`;
}

function lastDayStr(year: number, month: number): string {
  const last = new Date(year, month + 1, 0).getDate();
  return `${year}-${pad2(month + 1)}-${pad2(last)}`;
}

function dateStr(year: number, month: number, day: number): string {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Day cell styles ──────────────────────────────────────────────────────────

function dayCellClasses(day: ScheduleDay, isToday: boolean): string {
  const base = [
    "relative flex flex-col items-center justify-start gap-0.5 rounded-xl border",
    "pt-2 pb-1.5 px-1 transition-colors duration-100",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
    "min-h-14",
  ].join(" ");

  const todayRing = isToday ? "ring-2 ring-accent ring-offset-1" : "";

  if (!day.isEditable) {
    return `${base} cursor-default opacity-40 bg-surface-subtle border-line ${todayRing}`;
  }

  if (day.isOpen) {
    return day.isDefault
      ? `${base} cursor-pointer bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300 ${todayRing}`
      : `${base} cursor-pointer bg-green-100 border-green-400 hover:bg-green-50 hover:border-green-300 ${todayRing}`;
  } else {
    return day.isDefault
      ? `${base} cursor-pointer bg-surface-subtle border-line hover:bg-surface-hover ${todayRing}`
      : `${base} cursor-pointer bg-red-50 border-red-300 hover:bg-red-100 hover:border-red-400 ${todayRing}`;
  }
}

function dayNumberClasses(day: ScheduleDay): string {
  if (!day.isEditable) return "text-foreground-muted";
  if (day.isOpen) return "text-green-800";
  return day.isDefault ? "text-foreground-muted" : "text-red-700";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AgendaCalendar({
  initialDays,
  initialYear,
  initialMonth,
}: AgendaCalendarProps) {
  const today = todayString();

  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth); // 0-based
  const [days, setDays] = useState<ScheduleDay[]>(initialDays);
  const [fetching, setFetching] = useState(false);
  const [togglingDate, setTogglingDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The earliest navigable month is the current calendar month
  const nowYear = new Date().getUTCFullYear();
  const nowMonth = new Date().getUTCMonth();
  const isAtMinMonth = year === nowYear && month === nowMonth;

  // ── Fetch a month's schedule ───────────────────────────────────────────────
  const fetchMonth = useCallback(async (y: number, m: number) => {
    setFetching(true);
    setError(null);
    try {
      const from = firstDayStr(y, m);
      const to = lastDayStr(y, m);
      const res = await fetch(`/api/schedule?from=${from}&to=${to}`);
      if (!res.ok) throw new Error();
      const body = (await res.json()) as {
        success: boolean;
        data: { days: ScheduleDay[] };
      };
      setDays(body.data.days);
    } catch {
      setError("Não foi possível carregar a agenda. Tente novamente.");
    } finally {
      setFetching(false);
    }
  }, []);

  // ── Month navigation ───────────────────────────────────────────────────────
  function navigate(dir: -1 | 1) {
    const raw = month + dir;
    const newMonth = ((raw % 12) + 12) % 12;
    const newYear = raw < 0 ? year - 1 : raw > 11 ? year + 1 : year;
    setYear(newYear);
    setMonth(newMonth);
    void fetchMonth(newYear, newMonth);
  }

  // ── Toggle a day ───────────────────────────────────────────────────────────
  async function handleDayClick(day: ScheduleDay) {
    if (!day.isEditable || togglingDate !== null) return;

    const next = !day.isOpen;
    setTogglingDate(day.date);
    setError(null);

    // Optimistic update
    setDays((prev) =>
      prev.map((d) =>
        d.date === day.date ? { ...d, isOpen: next, isDefault: false } : d,
      ),
    );

    try {
      const res = await fetch(`/api/schedule/${day.date}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOpen: next }),
      });
      if (!res.ok) throw new Error();
      const body = (await res.json()) as {
        success: boolean;
        data: { day: ScheduleDay };
      };
      // Reconcile with authoritative server response
      setDays((prev) =>
        prev.map((d) => (d.date === body.data.day.date ? body.data.day : d)),
      );
    } catch {
      // Revert optimistic update
      setDays((prev) =>
        prev.map((d) =>
          d.date === day.date
            ? { ...d, isOpen: day.isOpen, isDefault: day.isDefault }
            : d,
        ),
      );
      setError("Não foi possível salvar a alteração. Tente novamente.");
    } finally {
      setTogglingDate(null);
    }
  }

  // ── Build calendar grid ────────────────────────────────────────────────────
  // Sunday-first: getDay() gives 0=Sun offset directly
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysMap = new Map(days.map((d) => [d.date, d]));

  // Leading empty slots + day numbers, padded to full rows
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const disabled = fetching || togglingDate !== null;

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      {/* ── Month navigation header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <button
          type="button"
          aria-label="Mês anterior"
          disabled={isAtMinMonth || fetching}
          onClick={() => navigate(-1)}
          className={[
            "flex h-8 w-8 items-center justify-center rounded-lg border border-line transition-colors",
            isAtMinMonth || fetching
              ? "cursor-not-allowed opacity-40"
              : "hover:bg-surface-hover",
          ].join(" ")}
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        <div className="min-w-40 text-center">
          {fetching ? (
            <span className="inline-flex items-center gap-2 text-sm text-foreground-muted">
              <SpinnerIcon className="h-4 w-4 animate-spin" />
              Carregando…
            </span>
          ) : (
            <span className="text-base font-semibold text-foreground">
              {MONTH_NAMES[month]} {year}
            </span>
          )}
        </div>

        <button
          type="button"
          aria-label="Próximo mês"
          disabled={fetching}
          onClick={() => navigate(1)}
          className={[
            "flex h-8 w-8 items-center justify-center rounded-lg border border-line transition-colors",
            fetching
              ? "cursor-not-allowed opacity-40"
              : "hover:bg-surface-hover",
          ].join(" ")}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      {/* ── Error banner ────────────────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          className="mx-4 mt-4 rounded-lg border border-danger/30 bg-danger/5 px-4 py-2.5"
        >
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {/* ── Calendar grid ───────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5">
        {/* Weekday headers */}
        <div className="mb-2 grid grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-foreground-muted"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((dayNum, idx) => {
            // Empty leading/trailing cell
            if (dayNum === null) {
              return <div key={`gap-${idx}`} aria-hidden="true" />;
            }

            const ds = dateStr(year, month, dayNum);
            const day = daysMap.get(ds);
            const isToday = ds === today;

            if (!day) {
              // Shouldn't happen, but render a placeholder gracefully
              return (
                <div
                  key={ds}
                  className="flex min-h-14 items-center justify-center rounded-xl border border-line bg-surface-subtle opacity-40"
                >
                  <span className="text-sm text-foreground-muted">
                    {dayNum}
                  </span>
                </div>
              );
            }

            const isToggling = togglingDate === ds;

            return (
              <button
                key={ds}
                type="button"
                aria-label={`${dayNum} de ${MONTH_NAMES[month]}: ${day.isOpen ? "Aberto" : "Fechado"}${day.isEditable ? " — clique para alternar" : " (data passada)"}`}
                aria-pressed={day.isOpen}
                disabled={!day.isEditable || disabled}
                onClick={() => void handleDayClick(day)}
                className={dayCellClasses(day, isToday)}
              >
                {/* Day number / spinner */}
                <span
                  className={`text-xs font-semibold leading-none sm:text-sm ${dayNumberClasses(day)}`}
                >
                  {isToggling ? (
                    <SpinnerIcon className="h-3.5 w-3.5 animate-spin opacity-70" />
                  ) : (
                    dayNum
                  )}
                </span>

                {/* Open/closed status dot */}
                {day.isEditable && !isToggling && (
                  <span
                    aria-hidden="true"
                    className={[
                      "h-1 w-1 rounded-full",
                      day.isOpen ? "bg-green-500" : "bg-red-400",
                    ].join(" ")}
                  />
                )}

                {/* Override indicator (accent dot, top-right corner) */}
                {!day.isDefault && day.isEditable && !isToggling && (
                  <span
                    aria-hidden="true"
                    title="Alterado manualmente"
                    className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Legend ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-line px-5 py-3">
        <LegendItem dotClass="bg-green-500" label="Aberto" />
        <LegendItem dotClass="bg-red-400" label="Fechado" />
        <LegendItem dotClass="bg-accent" label="Alterado manualmente" />
        <LegendItem dotClass="bg-line" label="Data passada" muted />
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LegendItem({
  dotClass,
  label,
  muted = false,
}: {
  dotClass: string;
  label: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`}
      />
      <span
        className={`text-xs ${muted ? "text-foreground-muted/60" : "text-foreground-muted"}`}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronLeftIcon({ className }: { className?: string }) {
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
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
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
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}
