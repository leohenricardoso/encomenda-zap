/**
 * /dashboard/orders — Orders listing page.
 *
 * Renders a full-featured table with:
 *   • Summary cards (total, value, today, avg ticket)
 *   • Filters (date range, status, customer search)  — client component
 *   • Configurable columns with localStorage persistence — client component
 *   • Server-side pagination
 *
 * All filter state lives in URL search params so deep-linking and browser
 * history work out of the box.
 */

import { Suspense } from "react";
import type { Metadata } from "next";
import { getSession } from "@/infra/http/auth/getSession";
import { listOrdersUseCase } from "@/infra/composition";
import { FulfillmentType } from "@/domain/order/Order";
import type { OrderWithDetails, OrderFilters } from "@/domain/order/Order";
import type { OrderViewModel } from "../_components/types";
import { parseOrdersFilters } from "../_lib/filters";
import { OrdersSummaryCards } from "./_components/OrdersSummaryCards";
import { OrdersFilters } from "./_components/OrdersFilters";
import { OrdersTableClient } from "./_components/OrdersTableClient";
import { PageHeader } from "../_components/PageHeader";

export const metadata: Metadata = { title: "Encomendas" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function OrdersListPage({ searchParams }: Props) {
  const session = await getSession();
  const sp = await searchParams;
  const { from, to, status, search, page, limit } = parseOrdersFilters(sp);

  // ── Build filters ─────────────────────────────────────────────────────────
  const filters: OrderFilters = {
    ...(from && { deliveryDateFrom: new Date(`${from}T00:00:00.000Z`) }),
    ...(to && { deliveryDateTo: new Date(`${to}T23:59:59.999Z`) }),
    ...(status && { status }),
    ...(search && { customerSearch: search }),
  };

  // ── Fetch all matching orders (pagination is done in-process) ─────────────
  //
  // For typical store sizes (< ~10k orders) this is fast. The date filter
  // keeps result sets small in practice. If a store were to accumulate very
  // large volumes, this could be moved to a DB-level paginated query.
  const rawOrders = await listOrdersUseCase.execute(session.storeId, filters);
  const orders = rawOrders.map(toViewModel);

  // ── Summary metrics (computed from full filtered set) ─────────────────────
  const todayStr = new Date().toISOString().slice(0, 10);
  const totalValue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const summary = {
    total: orders.length,
    totalValue,
    today: orders.filter((o) => o.deliveryDate === todayStr).length,
    avgTicket: orders.length > 0 ? totalValue / orders.length : 0,
  };

  // ── Paginate ──────────────────────────────────────────────────────────────
  const startIdx = (page - 1) * limit;
  const pageOrders = orders.slice(startIdx, startIdx + limit);

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 py-8 md:px-6 lg:px-8">
      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-foreground">Encomendas</h1>
        <p className="mt-0.5 text-sm text-foreground-muted">
          Listagem completa dos pedidos recebidos
        </p>
      </div>

      {/* ── Summary cards ──────────────────────────────────────────────── */}
      <div className="mb-6">
        <OrdersSummaryCards {...summary} />
      </div>

      {/* ── Filters ────────────────────────────────────────────────────── */}
      {/*
       * Suspense is required because OrdersFilters calls useSearchParams()
       * on the client. Without it Next.js 15 throws during static rendering.
       */}
      <div className="mb-6">
        <Suspense fallback={<FiltersSkeleton />}>
          <OrdersFilters />
        </Suspense>
      </div>

      {/* ── Table + pagination ─────────────────────────────────────────── */}
      <OrdersTableClient
        orders={pageOrders}
        total={orders.length}
        page={page}
        limit={limit}
      />
    </div>
  );
}

// ─── Skeleton for the filters bar ────────────────────────────────────────────

function FiltersSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-line bg-surface p-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        <div className="h-9 w-14 rounded-lg bg-surface-hover" />
        <div className="h-9 w-14 rounded-lg bg-surface-hover" />
        <div className="h-9 w-16 rounded-lg bg-surface-hover" />
        <div className="h-9 w-16 rounded-lg bg-surface-hover" />
        <div className="ml-auto h-9 w-48 rounded-lg bg-surface-hover" />
      </div>
    </div>
  );
}
