import { getSession } from "@/infra/http/auth/getSession";
import { listOrdersUseCase } from "@/infra/composition";
import { FulfillmentType, OrderStatus } from "@/domain/order/Order";
import type { OrderWithDetails } from "@/domain/order/Order";
import type { OrderViewModel } from "./_components/types";
import { OrderList } from "./_components/OrderList";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** "sexta-feira, 6 de março" capitalised. */
function formatDateLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const label = new Date(y!, m! - 1, d!).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Maps a rich OrderWithDetails to display-safe OrderViewModel (no IDs). */
function toViewModel(order: OrderWithDetails): OrderViewModel {
  const totalAmount = order.items.reduce(
    (sum, item) => sum + (item.unitPrice - item.discountAmount) * item.quantity,
    0,
  );

  const products = order.items.map(
    (item) =>
      `${item.quantity}× ${item.productName}${item.variantLabel ? ` (${item.variantLabel})` : ""}`,
  );

  const deliveryAddress =
    order.fulfillmentType === FulfillmentType.DELIVERY
      ? [
          order.deliveryStreet,
          order.deliveryNumber,
          order.deliveryNeighborhood,
          order.deliveryCity,
        ]
          .filter(Boolean)
          .join(", ") ||
        order.shippingAddress ||
        null
      : null;

  return {
    id: order.id,
    customerName: order.customerName,
    customerWhatsapp: order.customerWhatsapp,
    deliveryDate: order.deliveryDate.toISOString().slice(0, 10),
    pickupTime: order.pickupTime,
    fulfillmentType: order.fulfillmentType,
    deliveryAddress,
    deliveryCep: order.deliveryCep,
    status: order.status,
    totalAmount,
    products,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await getSession();

  // All dates stored as UTC midnight, so compare against UTC day boundaries.
  const todayStr = new Date().toISOString().slice(0, 10);
  const startOfToday = new Date(`${todayStr}T00:00:00.000Z`);
  const tomorrowStr = (() => {
    const t = new Date(startOfToday);
    t.setUTCDate(t.getUTCDate() + 1);
    return t.toISOString().slice(0, 10);
  })();

  const rawOrders = await listOrdersUseCase.execute(session.storeId, {
    deliveryDateFrom: startOfToday,
  });
  const orders = rawOrders.map(toViewModel);

  // ── Group ──────────────────────────────────────────────────────────────────
  const todayOrders = orders.filter((o) => o.deliveryDate === todayStr);
  const tomorrowOrders = orders.filter((o) => o.deliveryDate === tomorrowStr);

  const upcomingMap = new Map<string, OrderViewModel[]>();
  for (const o of orders.filter((o) => o.deliveryDate > tomorrowStr)) {
    const arr = upcomingMap.get(o.deliveryDate) ?? [];
    arr.push(o);
    upcomingMap.set(o.deliveryDate, arr);
  }
  const upcomingGroups = Array.from(upcomingMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayOrders]) => ({
      date,
      dateLabel: formatDateLabel(date),
      orders: dayOrders,
    }));

  // ── KPI counts ─────────────────────────────────────────────────────────────
  const pendingCount = orders.filter(
    (o) => o.status === OrderStatus.PENDING,
  ).length;

  return (
    <div className="px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Encomendas
          </h1>
          <p className="text-sm text-foreground-muted">
            Seus pedidos a partir de hoje, por data e horário.
          </p>
        </div>

        {/* ── KPI row ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <KpiCard
            value={todayOrders.length}
            unit={todayOrders.length === 1 ? "pedido" : "pedidos"}
            label="hoje"
          />
          <KpiCard
            value={pendingCount}
            unit={pendingCount === 1 ? "pedido" : "pedidos"}
            label="pendentes"
            accent={pendingCount > 0}
          />
        </div>

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

        {/* ── Próximos Dias ─────────────────────────────────────────────────── */}
        {upcomingGroups.length > 0 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-foreground-muted">
                Próximos Dias
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

        {/* ── Empty state ───────────────────────────────────────────────────── */}
        {orders.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-surface px-6 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-surface-hover">
              <BoxIcon className="h-7 w-7 text-foreground-muted" />
            </div>
            <p className="text-base font-medium text-foreground">
              Sem pedidos por enquanto
            </p>
            <p className="mt-1 text-sm text-foreground-muted">
              Os pedidos feitos pelos seus clientes aparecerão aqui.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── KpiCard ──────────────────────────────────────────────────────────────────

function KpiCard({
  value,
  label,
  unit,
  accent = false,
}: {
  value: number;
  label: string;
  unit: string;
  accent?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-xl border p-4",
        accent && value > 0
          ? "border-amber-200 bg-amber-50"
          : "border-line bg-surface",
      ].join(" ")}
    >
      <p
        className={[
          "text-3xl font-bold tabular-nums leading-none",
          accent && value > 0 ? "text-amber-700" : "text-foreground",
        ].join(" ")}
      >
        {value}
      </p>
      <p className="mt-1.5 text-xs text-foreground-muted">
        {unit} {label}
      </p>
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
