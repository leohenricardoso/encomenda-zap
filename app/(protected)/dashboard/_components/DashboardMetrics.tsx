/**
 * DashboardMetrics — three top-of-page KPI cards.
 *
 * Server Component — all props are plain numbers, no interactivity needed.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardMetricsProps {
  /** Orders scheduled for today (regardless of status). */
  todayCount: number;
  /** Orders in PENDING status across the current view. */
  pendingCount: number;
  /** Sum of totalAmount for today's orders. */
  todayRevenue: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

interface MetricCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  description: string;
  iconColor: string;
  valueColor?: string;
}

function MetricCard({
  icon,
  value,
  label,
  description,
  iconColor,
  valueColor = "text-foreground",
}: MetricCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground-muted">{label}</p>
        <div
          className={[
            "flex h-9 w-9 items-center justify-center rounded-lg",
            iconColor,
          ].join(" ")}
        >
          {icon}
        </div>
      </div>
      <div>
        <p
          className={[
            "text-2xl font-bold tracking-tight tabular-nums",
            valueColor,
          ].join(" ")}
        >
          {value}
        </p>
        <p className="mt-0.5 text-xs text-foreground-muted">{description}</p>
      </div>
    </div>
  );
}

// ─── DashboardMetrics ─────────────────────────────────────────────────────────

export function DashboardMetrics({
  todayCount,
  pendingCount,
  todayRevenue,
}: DashboardMetricsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* Orders Today */}
      <MetricCard
        icon={<CalendarIcon className="h-4 w-4" />}
        value={todayCount.toString()}
        label="Pedidos hoje"
        description={
          todayCount === 1
            ? "pedido agendado para hoje"
            : "pedidos agendados para hoje"
        }
        iconColor="bg-blue-50 text-blue-600"
      />

      {/* Awaiting Confirmation */}
      <MetricCard
        icon={<ClockIcon className="h-4 w-4" />}
        value={pendingCount.toString()}
        label="Aguardando confirmação"
        description={
          pendingCount > 0 ? "requerem sua atenção" : "nenhum pendente agora"
        }
        iconColor={
          pendingCount > 0
            ? "bg-amber-50 text-amber-600"
            : "bg-surface-hover text-foreground-muted"
        }
        valueColor={pendingCount > 0 ? "text-amber-700" : "text-foreground"}
      />

      {/* Estimated Revenue */}
      <MetricCard
        icon={<CurrencyIcon className="h-4 w-4" />}
        value={formatCurrency(todayRevenue)}
        label="Receita estimada hoje"
        description="soma dos pedidos de hoje"
        iconColor="bg-green-50 text-green-700"
        valueColor="text-green-700"
      />
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

function ClockIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function CurrencyIcon({ className }: { className?: string }) {
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
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
