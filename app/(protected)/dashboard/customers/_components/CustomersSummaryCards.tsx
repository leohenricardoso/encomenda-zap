// Server Component — no client interactivity needed.

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomersSummaryCardsProps {
  totalCustomers: number;
  customersWithOrders: number;
  totalRevenue: number;
  avgTicketPerCustomer: number;
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
        "flex items-start gap-3 rounded-xl border p-4",
        "bg-surface shadow-sm",
        accent ? "border-accent/30" : "border-line",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          accent
            ? "bg-accent/10 text-accent"
            : "bg-surface-hover text-foreground-muted",
        ].join(" ")}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-foreground-muted">{label}</p>
        <p
          className={[
            "mt-0.5 truncate text-xl font-semibold tabular-nums",
            accent ? "text-accent" : "text-foreground",
          ].join(" ")}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function UsersIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-5 w-5"
    >
      <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 17a9.953 9.953 0 0 1-5.385-1.572ZM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 0 0-1.588-3.755 4.502 4.502 0 0 1 5.874 2.636.818.818 0 0 1-.36.98A7.465 7.465 0 0 1 14.5 16Z" />
    </svg>
  );
}

function UserCheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-5 w-5"
    >
      <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
      <path
        fillRule="evenodd"
        d="M15.5 7a.75.75 0 0 1 .75.75v1.5h1.5a.75.75 0 0 1 0 1.5h-1.5v1.5a.75.75 0 0 1-1.5 0v-1.5h-1.5a.75.75 0 0 1 0-1.5h1.5v-1.5A.75.75 0 0 1 15.5 7Z"
        clipRule="evenodd"
      />
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
 * CustomersSummaryCards — four KPI cards at the top of the customers page.
 *
 * Values are computed server-side from the full filtered result set.
 */
export function CustomersSummaryCards({
  totalCustomers,
  customersWithOrders,
  totalRevenue,
  avgTicketPerCustomer,
}: CustomersSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <SummaryCard
        label="Total de clientes"
        value={totalCustomers.toString()}
        icon={<UsersIcon />}
      />
      <SummaryCard
        label="Com pedidos"
        value={customersWithOrders.toString()}
        icon={<UserCheckIcon />}
        accent={customersWithOrders > 0}
      />
      <SummaryCard
        label="Valor total vendido"
        value={formatCurrency(totalRevenue)}
        icon={<CurrencyIcon />}
      />
      <SummaryCard
        label="Ticket médio / cliente"
        value={totalCustomers > 0 ? formatCurrency(avgTicketPerCustomer) : "—"}
        icon={<ChartIcon />}
      />
    </div>
  );
}
