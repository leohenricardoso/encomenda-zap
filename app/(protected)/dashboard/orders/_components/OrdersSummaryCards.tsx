// Server Component — no client interactivity needed.

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface SummaryCardsProps {
  total: number;
  totalValue: number;
  today: number;
  avgTicket: number;
}

// ─── Card atom ────────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={[
        "relative flex flex-col gap-3 overflow-hidden rounded-xl border bg-surface p-5",
        "shadow-sm transition-shadow duration-150 hover:shadow-md",
        accent ? "border-accent/25" : "border-line",
      ].join(" ")}
    >
      {/* Top accent line — Professional.md "card top border accent" */}
      {accent && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-0.5 bg-accent"
        />
      )}

      {/* Icon + label row */}
      <div className="flex items-center justify-between">
        <p className="section-label">{label}</p>
        <div
          className={[
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            accent
              ? "bg-accent/10 text-accent"
              : "bg-surface-hover text-foreground-muted",
          ].join(" ")}
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>

      {/* Value */}
      <p
        className={[
          "truncate text-2xl font-semibold tabular-nums tracking-tight",
          accent ? "text-accent" : "text-foreground",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function BoxIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-5 w-5"
    >
      <path d="M2 3a1 1 0 0 1 1-1h1.379a1 1 0 0 1 .894.553l.448.894A1 1 0 0 0 6.618 4H18a1 1 0 0 1 .894 1.447l-2.5 5A1 1 0 0 1 15.5 11H5a1 1 0 0 1-.894-.553L2.106 5.106A1 1 0 0 1 2 4.5V3Z" />
      <path d="M6 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM14 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
    </svg>
  );
}

function CurrencyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-5 w-5"
    >
      <path d="M10.75 10.818v2.614A3.13 3.13 0 0 0 11.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 0 0-1.138-.432ZM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 0 0-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.33.615Z" />
      <path
        fillRule="evenodd"
        d="M9.99 2a8 8 0 1 0 0 16.001A8 8 0 0 0 9.99 2ZM4 10a6 6 0 1 1 12.001 0A6 6 0 0 1 4 10Zm6-4a.75.75 0 0 1 .75.75v.316a3.78 3.78 0 0 1 1.653.713c.426.33.497.9.111 1.246a.75.75 0 0 1-1.053-.055 2.26 2.26 0 0 0-.711-.454V9.24c.035.013.07.027.104.041.988.382 1.656 1.098 1.656 2.01 0 .896-.64 1.59-1.534 1.964a.75.75 0 0 1-1.376-.596.75.75 0 0 1 .626-.104v-.012a2.46 2.46 0 0 1-1.02-.56.75.75 0 0 1 .983-1.136 1.066 1.066 0 0 0 .337.22V9.24c-.973-.379-1.656-1.086-1.656-2.01 0-.77.45-1.413 1.1-1.795V5.25A.75.75 0 0 1 10 6Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-5 w-5"
    >
      <path
        fillRule="evenodd"
        d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-5 w-5"
    >
      <path d="M15.5 2A1.5 1.5 0 0 0 14 3.5v13a1.5 1.5 0 0 0 3 0v-13A1.5 1.5 0 0 0 15.5 2ZM9.5 6A1.5 1.5 0 0 0 8 7.5v9a1.5 1.5 0 0 0 3 0v-9A1.5 1.5 0 0 0 9.5 6ZM3.5 10A1.5 1.5 0 0 0 2 11.5v5a1.5 1.5 0 0 0 3 0v-5A1.5 1.5 0 0 0 3.5 10Z" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * OrdersSummaryCards — four KPI cards at the top of the orders listing page.
 *
 * Values are computed server-side from the full filtered result set so they
 * always match the visible table, regardless of the current pagination page.
 */
export function OrdersSummaryCards({
  total,
  totalValue,
  today,
  avgTicket,
}: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <SummaryCard
        label="Total de pedidos"
        value={total.toString()}
        icon={<BoxIcon />}
      />
      <SummaryCard
        label="Valor total"
        value={formatCurrency(totalValue)}
        icon={<CurrencyIcon />}
      />
      <SummaryCard
        label="Pedidos para hoje"
        value={today.toString()}
        icon={<CalendarIcon />}
        accent={today > 0}
      />
      <SummaryCard
        label="Ticket médio"
        value={total > 0 ? formatCurrency(avgTicket) : "—"}
        icon={<ChartIcon />}
      />
    </div>
  );
}
