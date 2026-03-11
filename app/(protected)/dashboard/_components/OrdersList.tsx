import type { OrderViewModel } from "./types";
import { OrderList } from "./OrderList";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UpcomingGroup {
  date: string;
  dateLabel: string;
  orders: OrderViewModel[];
}

interface OrdersListProps {
  todayOrders: OrderViewModel[];
  tomorrowOrders: OrderViewModel[];
  upcomingGroups: UpcomingGroup[];
  /** True when any URL filter (date, status, search) is active. */
  isFiltered: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * OrdersList — renders date-grouped order sections for the dashboard.
 *
 * Displays Today, Tomorrow, and upcoming date groups — or an empty state
 * when there are no orders to show.
 *
 * Server Component.
 */
export function OrdersList({
  todayOrders,
  tomorrowOrders,
  upcomingGroups,
  isFiltered,
}: OrdersListProps) {
  const totalOrders =
    todayOrders.length +
    tomorrowOrders.length +
    upcomingGroups.reduce((n, g) => n + g.orders.length, 0);

  if (totalOrders === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-surface px-6 py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-surface-subtle">
          <BoxIcon className="h-7 w-7 text-foreground-muted" />
        </div>
        <p className="text-base font-medium text-foreground">
          {isFiltered
            ? "Nenhum pedido com esses filtros"
            : "Sem pedidos por enquanto"}
        </p>
        <p className="mt-1 text-sm text-foreground-muted">
          {isFiltered
            ? "Tente alterar ou limpar os filtros para ver mais resultados."
            : "Os pedidos feitos pelos seus clientes aparecerão aqui."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Hoje ─────────────────────────────────────────────────────────── */}
      <OrderList
        title="Hoje"
        orders={todayOrders}
        highlighted
        emptyMessage="Nenhum pedido para hoje."
      />

      {/* ── Amanhã ───────────────────────────────────────────────────────── */}
      {tomorrowOrders.length > 0 && (
        <OrderList title="Amanhã" orders={tomorrowOrders} />
      )}

      {/* ── Próximos Dias ────────────────────────────────────────────────── */}
      {upcomingGroups.length > 0 && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-foreground-muted">
              Próximos dias
            </h2>
            <span className="rounded-full bg-surface-hover px-2.5 py-0.5 text-xs font-medium text-foreground-muted">
              {upcomingGroups.reduce((n, g) => n + g.orders.length, 0)}
            </span>
          </div>
          <div className="space-y-6">
            {upcomingGroups.map((group) => (
              <OrderList
                key={group.date}
                title={group.dateLabel}
                orders={group.orders}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Icon ─────────────────────────────────────────────────────────────────────

function BoxIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}
