"use client";

import { useEffect, useState } from "react";
import type { OrderViewModel } from "../../_components/types";
import { OrdersTable } from "./OrdersTable";
import {
  ColumnSelector,
  loadVisibleColumns,
  type VisibleColumns,
} from "./ColumnSelector";
import { Pagination } from "./Pagination";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrdersTableClientProps {
  orders: OrderViewModel[];
  total: number;
  page: number;
  limit: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * OrdersTableClient — client shell that wires together:
 *   • ColumnSelector (localStorage-backed column visibility)
 *   • OrdersTable    (renders the actual <table>)
 *   • Pagination     (URL-based page navigation)
 *
 * The `orders` prop is already the correct page slice — the server component
 * handles slicing so this client component never fetches data itself.
 */
export function OrdersTableClient({
  orders,
  total,
  page,
  limit,
}: OrdersTableClientProps) {
  // ── Column visibility — hydrates from localStorage after mount ─────────────
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>(
    () =>
      // On SSR, use all-visible defaults; on client, load from localStorage.
      // This prevents hydration mismatch.
      Object.fromEntries(
        [
          "orderNumber",
          "customer",
          "whatsapp",
          "products",
          "itemCount",
          "totalAmount",
          "deliveryDate",
          "createdAt",
          "status",
          "fulfillment",
        ].map((k) => [k, true]),
      ) as VisibleColumns,
  );

  // After hydration, load localStorage preferences
  useEffect(() => {
    setVisibleColumns(loadVisibleColumns());
  }, []);

  return (
    <div className="space-y-4">
      {/* ── Table header: count + column selector ──────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-foreground-muted">
          {total === 0 ? (
            "Nenhum pedido"
          ) : (
            <>
              <span className="font-medium text-foreground tabular-nums">
                {total}
              </span>{" "}
              {total === 1 ? "pedido encontrado" : "pedidos encontrados"}
            </>
          )}
        </p>
        <ColumnSelector value={visibleColumns} onChange={setVisibleColumns} />
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <OrdersTable orders={orders} visibleColumns={visibleColumns} />

      {/* ── Pagination (only shown when there's data) ───────────────────── */}
      {total > 0 && <Pagination page={page} limit={limit} total={total} />}
    </div>
  );
}
