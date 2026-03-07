"use client";

import { useEffect, useState } from "react";
import {
  CustomersColumnSelector,
  loadCustomerVisibleColumns,
  type CustomerVisibleColumns,
} from "./CustomersColumnSelector";
import { CustomersTable, type CustomerViewModel } from "./CustomersTable";
import { Pagination } from "../../orders/_components/Pagination";

// ─── Component ────────────────────────────────────────────────────────────────

interface CustomersTableClientProps {
  customers: CustomerViewModel[];
  total: number;
  page: number;
  limit: number;
}

/**
 * CustomersTableClient — client shell that wires the column selector, table,
 * and pagination together.
 *
 * Column preferences are stored in localStorage (SSR-safe: defaults to all
 * columns visible on first render, then updates after hydration).
 */
export function CustomersTableClient({
  customers,
  total,
  page,
  limit,
}: CustomersTableClientProps) {
  const [visibleColumns, setVisibleColumns] = useState<CustomerVisibleColumns>(
    () => loadCustomerVisibleColumns(),
  );

  // Re-read from localStorage after hydration to resolve SSR mismatch
  useEffect(() => {
    setVisibleColumns(loadCustomerVisibleColumns());
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* ── Header row: count + column selector ──────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-foreground-muted">
          <span className="font-semibold tabular-nums text-foreground">
            {total}
          </span>{" "}
          {total === 1 ? "cliente encontrado" : "clientes encontrados"}
        </p>

        <CustomersColumnSelector
          visibleColumns={visibleColumns}
          onChange={setVisibleColumns}
        />
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <CustomersTable customers={customers} visibleColumns={visibleColumns} />

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {total > 0 && (
        <Pagination page={page} limit={limit} total={total} noun="clientes" />
      )}
    </div>
  );
}
