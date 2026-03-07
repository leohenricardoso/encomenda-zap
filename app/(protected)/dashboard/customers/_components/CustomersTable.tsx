"use client";

import Link from "next/link";
import type {
  CustomerColumnKey,
  CustomerVisibleColumns,
} from "./CustomersColumnSelector";

// ─── View-model (matches what the server page passes) ─────────────────────────

export interface CustomerViewModel {
  id: string;
  name: string;
  whatsapp: string;
  ordersCount: number;
  totalSpent: number;
  avgTicket: number;
  firstOrderAt: Date | null;
  lastOrderAt: Date | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(d: Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatPhone(phone: string): string {
  // Strip non-digits
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

// ─── Column header config ─────────────────────────────────────────────────────

const COLUMNS: { key: CustomerColumnKey; label: string; align?: "right" }[] = [
  { key: "name", label: "Cliente" },
  { key: "whatsapp", label: "Telefone" },
  { key: "ordersCount", label: "Pedidos", align: "right" },
  { key: "totalSpent", label: "Valor total", align: "right" },
  { key: "avgTicket", label: "Ticket médio", align: "right" },
  { key: "firstOrder", label: "Primeiro pedido" },
  { key: "lastOrder", label: "Último pedido" },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface CustomersTableProps {
  customers: CustomerViewModel[];
  visibleColumns: CustomerVisibleColumns;
}

export function CustomersTable({
  customers,
  visibleColumns,
}: CustomersTableProps) {
  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-line bg-surface py-12 text-center shadow-sm">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="h-12 w-12 text-foreground-muted/40"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
          />
        </svg>
        <p className="text-sm text-foreground-muted">
          Nenhum cliente encontrado para os filtros aplicados.
        </p>
      </div>
    );
  }

  const visibleCols = COLUMNS.filter((c) => visibleColumns[c.key]);

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-sm">
      <table className="w-full min-w-[600px] text-sm">
        <thead>
          <tr className="border-b border-line">
            {visibleCols.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={[
                  "px-4 py-3 text-xs font-semibold uppercase tracking-wider text-foreground-muted",
                  col.align === "right" ? "text-right" : "text-left",
                ].join(" ")}
              >
                {col.label}
              </th>
            ))}
            {/* Actions column always visible */}
            <th scope="col" className="px-4 py-3" aria-label="Ações" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {customers.map((customer) => (
            <tr
              key={customer.id}
              className="transition-colors hover:bg-surface-hover"
            >
              {visibleCols.map((col) => (
                <td
                  key={col.key}
                  className={[
                    "px-4 py-3",
                    col.align === "right"
                      ? "text-right tabular-nums text-foreground"
                      : "text-foreground",
                  ].join(" ")}
                >
                  {renderCell(col.key, customer)}
                </td>
              ))}

              {/* Action — link to orders filtered by this customer's name */}
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/dashboard/orders?search=${encodeURIComponent(customer.name)}`}
                  className="rounded px-2 py-1 text-xs text-accent underline-offset-2 hover:underline"
                  title="Ver pedidos deste cliente"
                >
                  Pedidos
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Cell renderer ────────────────────────────────────────────────────────────

function renderCell(key: CustomerColumnKey, customer: CustomerViewModel) {
  switch (key) {
    case "name":
      return <span className="font-medium">{customer.name}</span>;

    case "whatsapp": {
      const digits = customer.whatsapp.replace(/\D/g, "");
      const international = digits.startsWith("55") ? digits : `55${digits}`;
      return (
        <a
          href={`https://wa.me/${international}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline-offset-2 hover:underline"
        >
          {formatPhone(customer.whatsapp)}
        </a>
      );
    }

    case "ordersCount":
      return (
        <span
          className={[
            "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold",
            customer.ordersCount > 0
              ? "bg-accent/10 text-accent"
              : "bg-surface-hover text-foreground-muted",
          ].join(" ")}
        >
          {customer.ordersCount}
        </span>
      );

    case "totalSpent":
      return formatCurrency(customer.totalSpent);

    case "avgTicket":
      return customer.ordersCount > 0
        ? formatCurrency(customer.avgTicket)
        : "—";

    case "firstOrder":
      return (
        <span className="text-foreground-muted">
          {formatDate(customer.firstOrderAt)}
        </span>
      );

    case "lastOrder":
      return (
        <span className="text-foreground-muted">
          {formatDate(customer.lastOrderAt)}
        </span>
      );
  }
}
