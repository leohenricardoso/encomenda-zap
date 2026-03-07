"use client";

import Link from "next/link";
import type { OrderViewModel } from "../../_components/types";
import { StatusBadge } from "../../_components/StatusBadge";
import { FulfillmentType } from "@/domain/order/Order";
import type { VisibleColumns } from "./ColumnSelector";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n);
}

function fmtDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y!, m! - 1, d!).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtPhone(raw: string) {
  const d = raw.replace(/\D/g, "");
  // Format: international 55 + 2-digit DDD + 8-9 digit number
  if (d.length >= 12) {
    const num = d.slice(-11);
    return `(${num.slice(0, 2)}) ${num.slice(2, 7)}-${num.slice(7)}`;
  }
  if (d.length === 11)
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  return raw;
}

/** Show max 2 product names + "+N" overflow. */
function fmtProducts(products: string[]) {
  if (products.length === 0)
    return <span className="italic text-foreground-muted">—</span>;
  if (products.length <= 2) return products.join(", ");
  return `${products.slice(0, 2).join(", ")} +${products.length - 2}`;
}

const FULFILLMENT_LABELS: Record<FulfillmentType, string> = {
  [FulfillmentType.PICKUP]: "Retirada",
  [FulfillmentType.DELIVERY]: "Entrega",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrdersTableProps {
  orders: OrderViewModel[];
  visibleColumns: VisibleColumns;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * OrdersTable — a responsive, accessible table of orders.
 *
 * Renders only the columns marked visible in `visibleColumns`.
 * All cells are linked to the order detail page via the order id.
 *
 * Horizontally scrollable on mobile — content never breaks the layout.
 */
export function OrdersTable({ orders, visibleColumns: vc }: OrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-surface px-6 py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-hover">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-6 w-6 text-foreground-muted"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 15.803a7.5 7.5 0 0 0 10.607 0Z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-foreground">
          Nenhum pedido encontrado
        </p>
        <p className="mt-1 text-xs text-foreground-muted">
          Tente mudar os filtros ou o período selecionado.
        </p>
      </div>
    );
  }

  return (
    /* Horizontal scroll wrapper — prevents table from overflowing on narrow screens */
    <div className="overflow-x-auto rounded-xl border border-line shadow-sm">
      <table className="min-w-full divide-y divide-line text-sm">
        {/* ── Head ─────────────────────────────────────────────────────────── */}
        <thead>
          <tr className="bg-surface-hover">
            {vc.orderNumber && <Th>#Pedido</Th>}
            {vc.customer && <Th>Cliente</Th>}
            {vc.whatsapp && <Th>Telefone</Th>}
            {vc.products && <Th>Produtos</Th>}
            {vc.itemCount && <Th align="right">Itens</Th>}
            {vc.totalAmount && <Th align="right">Valor</Th>}
            {vc.deliveryDate && <Th>Entrega</Th>}
            {vc.createdAt && <Th>Pedido em</Th>}
            {vc.status && <Th>Status</Th>}
            {vc.fulfillment && <Th>Tipo</Th>}
            {/* Always show action column */}
            <Th>
              <span className="sr-only">Ações</span>
            </Th>
          </tr>
        </thead>

        {/* ── Body ─────────────────────────────────────────────────────────── */}
        <tbody className="divide-y divide-line bg-surface">
          {orders.map((order) => (
            <tr
              key={order.id}
              className="transition-colors hover:bg-surface-hover/60 group"
            >
              {vc.orderNumber && (
                <Td>
                  {order.orderNumber != null ? (
                    <span className="rounded-md bg-surface-hover px-1.5 py-0.5 text-xs font-bold tabular-nums text-foreground">
                      #{order.orderNumber}
                    </span>
                  ) : (
                    <span className="text-foreground-muted">—</span>
                  )}
                </Td>
              )}
              {vc.customer && (
                <Td>
                  <span className="font-medium text-foreground">
                    {order.customerName}
                  </span>
                </Td>
              )}
              {vc.whatsapp && (
                <Td>
                  <a
                    href={`https://wa.me/${order.customerWhatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground-muted hover:text-foreground hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {fmtPhone(order.customerWhatsapp)}
                  </a>
                </Td>
              )}
              {vc.products && (
                <Td>
                  <span
                    className="text-foreground-muted"
                    title={order.products.join(", ")}
                  >
                    {fmtProducts(order.products)}
                  </span>
                </Td>
              )}
              {vc.itemCount && (
                <Td align="right">
                  <span className="tabular-nums text-foreground-muted">
                    {order.products.length}
                  </span>
                </Td>
              )}
              {vc.totalAmount && (
                <Td align="right">
                  <span className="tabular-nums font-medium text-foreground">
                    {fmtCurrency(order.totalAmount)}
                  </span>
                </Td>
              )}
              {vc.deliveryDate && (
                <Td>
                  <span className="tabular-nums text-foreground-muted">
                    {fmtDate(order.deliveryDate)}
                    {order.pickupTime && (
                      <span className="ml-1 text-xs">{order.pickupTime}</span>
                    )}
                  </span>
                </Td>
              )}
              {vc.createdAt && (
                <Td>
                  <span className="tabular-nums text-foreground-muted">
                    {fmtDateTime(order.createdAt)}
                  </span>
                </Td>
              )}
              {vc.status && (
                <Td>
                  <StatusBadge status={order.status} size="sm" />
                </Td>
              )}
              {vc.fulfillment && (
                <Td>
                  <span className="text-foreground-muted">
                    {FULFILLMENT_LABELS[order.fulfillmentType]}
                  </span>
                </Td>
              )}
              {/* Detail link */}
              <Td>
                <Link
                  href={`/dashboard/orders/${order.id}`}
                  className="whitespace-nowrap rounded px-2 py-1 text-xs font-medium text-foreground-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-accent/40"
                >
                  Ver detalhes →
                </Link>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Table cell helpers ───────────────────────────────────────────────────────

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      scope="col"
      className={[
        "px-4 py-3 text-xs font-semibold uppercase tracking-wider text-foreground-muted",
        align === "right" ? "text-right" : "text-left",
      ].join(" ")}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <td
      className={[
        "whitespace-nowrap px-4 py-3",
        align === "right" ? "text-right" : "text-left",
      ].join(" ")}
    >
      {children}
    </td>
  );
}
