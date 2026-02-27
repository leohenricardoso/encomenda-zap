"use client";

import { useTransition, useState } from "react";
import { OrderStatus } from "@/domain/order/Order";
import { updateOrderStatus } from "../actions";

// ─── Status display config ────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; badgeClass: string }
> = {
  [OrderStatus.PENDING]: {
    label: "Pendente",
    badgeClass: "bg-amber-100 text-amber-800",
  },
  [OrderStatus.APPROVED]: {
    label: "Aprovado",
    badgeClass: "bg-green-100 text-green-800",
  },
  [OrderStatus.REJECTED]: {
    label: "Recusado",
    badgeClass: "bg-surface-hover text-foreground-muted",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface StatusActionsProps {
  orderId: string;
  currentStatus: OrderStatus;
}

/**
 * StatusActions — sticky action bar with status badge and transition buttons.
 *
 * Transitions available:
 *   PENDING  → Aprovar | Recusar
 *   APPROVED → Recusar
 *   REJECTED → (terminal, read-only)
 *
 * Uses a Server Action for immediate feedback with optimistic revalidation.
 */
export function StatusActions({ orderId, currentStatus }: StatusActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const cfg = STATUS_CONFIG[currentStatus];

  function handleTransition(newStatus: OrderStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, newStatus);
      if (!result.success) setError(result.error);
    });
  }

  const canApprove = currentStatus === OrderStatus.PENDING;
  const canReject =
    currentStatus === OrderStatus.PENDING ||
    currentStatus === OrderStatus.APPROVED;

  return (
    <div className="sticky bottom-0 left-0 right-0 z-20 border-t border-line bg-surface/95 backdrop-blur-sm px-4 py-3 sm:relative sm:bottom-auto sm:border sm:rounded-xl sm:bg-surface sm:backdrop-blur-none">
      <div className="mx-auto max-w-2xl flex flex-col gap-2">
        {/* ── Current status ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-foreground-muted">
            Status
          </span>
          <span
            className={[
              "rounded-full px-3 py-1 text-sm font-semibold",
              cfg.badgeClass,
            ].join(" ")}
          >
            {cfg.label}
          </span>
        </div>

        {/* ── Error message ───────────────────────────────────────────── */}
        {error && (
          <p className="text-xs text-danger bg-danger/10 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        {/* ── Action buttons ──────────────────────────────────────────── */}
        {(canApprove || canReject) && (
          <div className="flex gap-2 mt-1">
            {canApprove && (
              <button
                type="button"
                onClick={() => handleTransition(OrderStatus.APPROVED)}
                disabled={isPending}
                className={[
                  "flex-1 flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5",
                  "bg-green-600 text-white text-sm font-semibold",
                  "hover:bg-green-700 transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                ].join(" ")}
              >
                <CheckIcon className="h-4 w-4 shrink-0" />
                {isPending ? "Salvando..." : "Aprovar"}
              </button>
            )}
            {canReject && (
              <button
                type="button"
                onClick={() => handleTransition(OrderStatus.REJECTED)}
                disabled={isPending}
                className={[
                  "flex-1 flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5",
                  "border border-danger text-danger text-sm font-semibold",
                  "hover:bg-danger/5 transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                ].join(" ")}
              >
                <XIcon className="h-4 w-4 shrink-0" />
                {isPending ? "Salvando..." : "Recusar"}
              </button>
            )}
          </div>
        )}

        {/* ── Terminal state message ──────────────────────────────────── */}
        {currentStatus === OrderStatus.REJECTED && (
          <p className="text-xs text-center text-foreground-muted py-1">
            Pedido recusado — nenhuma ação disponível.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
