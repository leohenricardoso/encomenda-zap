import { Suspense } from "react";
import { getSession } from "@/infra/http/auth/getSession";
import { listOrdersUseCase } from "@/infra/composition";
import { FulfillmentType, OrderStatus } from "@/domain/order/Order";
import type { OrderWithDetails, OrderFilters } from "@/domain/order/Order";
import type { OrderViewModel } from "./_components/types";
import { FilterBar } from "./_components/FilterBar";
import { DashboardMetrics } from "./_components/DashboardMetrics";
import { OrdersList } from "./_components/OrdersList";
import { parseFilters } from "./_lib/filters";

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
    orderStatus: order.orderStatus,
    totalAmount,
    products,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt.toISOString(),
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  const sp = await searchParams;

  // ── Parse filters from URL ────────────────────────────────────────────────
  const parsed = parseFilters(sp);

  // Default date range: from today onwards (no upper bound).
  const todayStr = new Date().toISOString().slice(0, 10);
  const startOfToday = new Date(`${todayStr}T00:00:00.000Z`);
  const tomorrowStr = (() => {
    const t = new Date(startOfToday);
    t.setUTCDate(t.getUTCDate() + 1);
    return t.toISOString().slice(0, 10);
  })();

  const filters: OrderFilters = {
    // If the user has no date filter set, default to today onwards.
    deliveryDateFrom: parsed.from
      ? new Date(`${parsed.from}T00:00:00.000Z`)
      : startOfToday,
    ...(parsed.to && {
      deliveryDateTo: new Date(`${parsed.to}T23:59:59.999Z`),
    }),
    ...(parsed.status && { status: parsed.status }),
  };

  const rawOrders = await listOrdersUseCase.execute(session.storeId, filters);
  const orders = rawOrders.map(toViewModel);

  // ── Search filter (applied to list; metrics use unfiltered data) ──────────
  const q = ((sp.q as string | undefined) ?? "").toLowerCase().trim();
  const displayOrders = q
    ? orders.filter((o) => o.customerName.toLowerCase().includes(q))
    : orders;

  // ── Group display orders ──────────────────────────────────────────────────
  const todayOrders = displayOrders.filter((o) => o.deliveryDate === todayStr);
  const tomorrowOrders = displayOrders.filter(
    (o) => o.deliveryDate === tomorrowStr,
  );

  const upcomingMap = new Map<string, OrderViewModel[]>();
  for (const o of displayOrders.filter((o) => o.deliveryDate > tomorrowStr)) {
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

  // ── Metrics (unfiltered: counts from ALL fetched orders) ──────────────────
  const allTodayOrders = orders.filter((o) => o.deliveryDate === todayStr);
  const pendingCount = orders.filter(
    (o) => o.status === OrderStatus.PENDING,
  ).length;
  const todayRevenue = allTodayOrders.reduce(
    (sum, o) => sum + o.totalAmount,
    0,
  );

  const isFiltered = !!(parsed.status || parsed.from || q);

  return (
    <div className="px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Encomendas
          </h1>
          <p className="text-sm text-foreground-muted">
            {isFiltered
              ? "Resultados filtrados — use os filtros abaixo para ajustar."
              : "Seus pedidos a partir de hoje, por data e horário."}
          </p>
        </div>

        {/* ── Metric cards ─────────────────────────────────────────────────── */}
        <DashboardMetrics
          todayCount={allTodayOrders.length}
          pendingCount={pendingCount}
          todayRevenue={todayRevenue}
        />

        {/* ── Filter bar ───────────────────────────────────────────────────── */}
        <Suspense fallback={<FilterBarSkeleton />}>
          <FilterBar />
        </Suspense>

        {/* ── Order sections ───────────────────────────────────────────────── */}
        <OrdersList
          todayOrders={todayOrders}
          tomorrowOrders={tomorrowOrders}
          upcomingGroups={upcomingGroups}
          isFiltered={isFiltered}
        />
      </div>
    </div>
  );
}

// ─── FilterBarSkeleton ────────────────────────────────────────────────────────

function FilterBarSkeleton() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 space-y-3 animate-pulse">
      <div className="h-9 rounded-lg bg-surface-hover" />
      <div className="flex gap-2">
        <div className="h-7 w-32 rounded-lg bg-surface-hover" />
        <div className="h-7 w-40 rounded-lg bg-surface-hover" />
      </div>
    </div>
  );
}
