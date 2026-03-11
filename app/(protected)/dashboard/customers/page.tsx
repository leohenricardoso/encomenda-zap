/**
 * /dashboard/customers — Customers listing page.
 *
 * Renders:
 *   • Summary cards (total, with orders, total revenue, avg ticket)
 *   • Filters (search, min orders, min spent)  — client component in Suspense
 *   • Configurable columns with localStorage persistence
 *   • In-process pagination
 *
 * All filter state lives in URL search params.
 */

import { Suspense } from "react";
import type { Metadata } from "next";
import { getSession } from "@/infra/http/auth/getSession";
import { listCustomersWithStatsUseCase } from "@/infra/composition";
import type {
  CustomerFilters,
  CustomerWithStats,
} from "@/domain/customer/Customer";
import { CustomersSummaryCards } from "./_components/CustomersSummaryCards";
import { CustomersFilters } from "./_components/CustomersFilters";
import { CustomersTableClient } from "./_components/CustomersTableClient";
import type { CustomerViewModel } from "./_components/CustomersTable";
import { PageHeader } from "../_components/PageHeader";

export const metadata: Metadata = { title: "Clientes" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toViewModel(c: CustomerWithStats): CustomerViewModel {
  return {
    id: c.id,
    name: c.name,
    whatsapp: c.whatsapp,
    ordersCount: c.ordersCount,
    totalSpent: c.totalSpent,
    avgTicket: c.avgTicket,
    firstOrderAt: c.firstOrderAt,
    lastOrderAt: c.lastOrderAt,
  };
}

function parseParam(
  sp: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const v = sp[key];
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

function parseIntParam(
  sp: Record<string, string | string[] | undefined>,
  key: string,
  fallback: number,
): number {
  const v = parseParam(sp, key);
  if (!v) return fallback;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseFloatParam(
  sp: Record<string, string | string[] | undefined>,
  key: string,
): number | undefined {
  const v = parseParam(sp, key);
  if (!v) return undefined;
  const n = parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CustomersPage({ searchParams }: Props) {
  const session = await getSession();
  const sp = await searchParams;

  // ── Parse URL params ────────────────────────────────────────────────────
  const search = parseParam(sp, "search");
  const minOrders = parseIntParam(sp, "min_orders", 0) || undefined;
  const minTotalSpent = parseFloatParam(sp, "min_spent");
  const page = parseIntParam(sp, "page", 1);
  const limitRaw = parseIntParam(sp, "limit", 25);
  const limit = [10, 25, 50].includes(limitRaw) ? limitRaw : 25;

  // ── Build filters ───────────────────────────────────────────────────────
  const filters: CustomerFilters = {
    ...(search && { search }),
    ...(minOrders !== undefined && minOrders > 0 && { minOrders }),
    ...(minTotalSpent !== undefined && { minTotalSpent }),
  };

  // ── Fetch all matching customers (in-process pagination) ────────────────
  const rawCustomers = await listCustomersWithStatsUseCase.execute(
    session.storeId,
    filters,
  );
  const customers = rawCustomers.map(toViewModel);

  // ── Summary metrics ─────────────────────────────────────────────────────
  const totalCustomers = customers.length;
  const customersWithOrders = customers.filter((c) => c.ordersCount > 0).length;
  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const avgTicketPerCustomer =
    customersWithOrders > 0 ? totalRevenue / customersWithOrders : 0;

  // ── Paginate ────────────────────────────────────────────────────────────
  const startIdx = (page - 1) * limit;
  const pageCustomers = customers.slice(startIdx, startIdx + limit);

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 py-8 md:px-6 lg:px-8">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-foreground">Clientes</h1>
        <p className="mt-0.5 text-sm text-foreground-muted">
          Listagem de clientes e seus históricos de compra
        </p>
      </div>

      {/* ── Summary cards ────────────────────────────────────────────────── */}
      <div className="mb-6">
        <CustomersSummaryCards
          totalCustomers={totalCustomers}
          customersWithOrders={customersWithOrders}
          totalRevenue={totalRevenue}
          avgTicketPerCustomer={avgTicketPerCustomer}
        />
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <Suspense fallback={<FiltersSkeleton />}>
          <CustomersFilters />
        </Suspense>
      </div>

      {/* ── Table + pagination ───────────────────────────────────────────── */}
      <CustomersTableClient
        customers={pageCustomers}
        total={totalCustomers}
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
      <div className="flex flex-wrap gap-3">
        <div className="h-9 flex-1 rounded-lg bg-surface-hover" />
        <div className="h-9 w-32 rounded-lg bg-surface-hover" />
        <div className="h-9 w-36 rounded-lg bg-surface-hover" />
      </div>
    </div>
  );
}
