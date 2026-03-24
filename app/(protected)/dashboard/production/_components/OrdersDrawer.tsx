"use client";

import { useEffect, useRef } from "react";
import type { DailyProductionItem } from "@/domain/production/DailyProduction";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrdersDrawerProps {
  item: DailyProductionItem | null;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OrdersDrawer({ item, onClose }: OrdersDrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (item) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [item]);

  if (!item) return null;

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40 print:hidden"
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Pedidos para ${item.productName}`}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-surface shadow-xl print:hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-line px-6 py-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {item.productName}
              {item.variationLabel && (
                <span className="ml-1.5 text-sm font-normal text-muted">
                  — {item.variationLabel}
                </span>
              )}
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              {item.totalQuantity} unidade{item.totalQuantity !== 1 ? "s" : ""}{" "}
              em {item.orders.length} pedido
              {item.orders.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="ml-4 rounded-lg p-1 text-muted hover:bg-hover hover:text-foreground transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Orders table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-raised">
                <th className="px-5 py-3 text-left font-medium text-muted">
                  Pedido
                </th>
                <th className="px-5 py-3 text-left font-medium text-muted">
                  Cliente
                </th>
                <th className="px-5 py-3 text-center font-medium text-muted">
                  Qtd
                </th>
                <th className="px-5 py-3 text-right font-medium text-muted">
                  Retirada
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {item.orders.map((order) => (
                <tr key={order.orderId} className="hover:bg-hover">
                  <td className="px-5 py-3 font-medium text-foreground">
                    {order.incrementId != null ? `#${order.incrementId}` : "—"}
                  </td>
                  <td className="px-5 py-3 text-foreground">
                    {order.customerName}
                  </td>
                  <td className="px-5 py-3 text-center font-semibold tabular-nums text-accent">
                    {order.quantity}
                  </td>
                  <td className="px-5 py-3 text-right text-muted">
                    {order.deliveryTime ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
