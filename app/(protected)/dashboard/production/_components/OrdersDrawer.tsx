"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
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

        {/* Orders list */}
        <div className="flex-1 overflow-y-auto divide-y divide-line">
          {item.orders.map((order) => {
            const waDigits = order.customerWhatsapp.replace(/\D/g, "");
            const waMsg = `Olá, tudo bem? Referente à observação do pedido #${order.incrementId ?? "—"}, na qual diz: '${order.notes}', gostaria de confirmar algumas informações.`;
            const waUrl = order.notes
              ? `https://wa.me/${waDigits}?text=${encodeURIComponent(waMsg)}`
              : null;

            return (
              <div key={order.orderId} className="px-6 py-4 hover:bg-hover transition-colors">
                {/* Row 1: order id + qty + time */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {order.incrementId != null ? (
                      <Link
                        href={`/dashboard/orders/${order.orderId}`}
                        className="text-sm font-semibold text-accent hover:underline"
                      >
                        #{order.incrementId}
                      </Link>
                    ) : (
                      <span className="text-sm font-semibold text-foreground">—</span>
                    )}
                    <span className="text-sm text-foreground">{order.customerName}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-sm font-bold tabular-nums text-accent">
                      {order.quantity}
                    </span>
                    <span className="text-sm text-muted">{order.deliveryTime ?? "—"}</span>
                  </div>
                </div>

                {/* Row 2: observation + WA button */}
                <div className="mt-2">
                  {order.notes ? (
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-amber-700">Observação</p>
                        <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                          {order.notes}
                        </p>
                      </div>
                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Falar com cliente no WhatsApp"
                          className="shrink-0 flex items-center gap-1.5 rounded-lg bg-green-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-green-600 transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-3.5 w-3.5"
                          >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347Z" />
                            <path
                              fillRule="evenodd"
                              d="M12 2C6.477 2 2 6.478 2 12c0 1.85.504 3.58 1.383 5.063L2 22l5.09-1.368A9.953 9.953 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2Zm0 18a7.95 7.95 0 0 1-4.086-1.126l-.293-.174-3.022.812.824-2.954-.19-.303A7.95 7.95 0 0 1 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8Z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Falar
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted italic">Sem observações</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
