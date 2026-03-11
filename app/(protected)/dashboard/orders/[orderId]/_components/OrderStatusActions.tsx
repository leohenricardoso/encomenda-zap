"use client";

import { useTransition, useState } from "react";
import { OrderTrackingStatus } from "@/domain/order/Order";
import { updateOrderTrackingStatus } from "../actions";
import { InlineFeedback } from "../../../../../_components/InlineFeedback";

// ─── Button config ────────────────────────────────────────────────────────────

interface TrackingAction {
  label: string;
  next: OrderTrackingStatus;
  variant: "primary" | "danger";
  requiresConfirm?: boolean;
}

const ACTIONS_BY_STATUS: Partial<
  Record<OrderTrackingStatus, TrackingAction[]>
> = {
  [OrderTrackingStatus.PENDING]: [
    {
      label: "Marcar como Pago",
      next: OrderTrackingStatus.PAID,
      variant: "primary",
    },
    {
      label: "Cancelar pedido",
      next: OrderTrackingStatus.CANCELLED,
      variant: "danger",
      requiresConfirm: true,
    },
  ],
  [OrderTrackingStatus.PAID]: [
    {
      label: "Marcar como Entregue",
      next: OrderTrackingStatus.DELIVERED,
      variant: "primary",
    },
  ],
  // DELIVERED and CANCELLED have no further actions (terminal states)
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderStatusActionsProps {
  orderId: string;
  initialStatus: OrderTrackingStatus;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * OrderStatusActions — action buttons for post-approval tracking transitions.
 *
 * Client Component:
 *   - Optimistic status update (reverts on failure).
 *   - Two-step confirmation for destructive actions (Cancel).
 *   - Shows InlineFeedback on success / failure.
 *
 * Renders null for terminal states (DELIVERED, CANCELLED).
 */
export function OrderStatusActions({
  orderId,
  initialStatus,
}: OrderStatusActionsProps) {
  const [status, setStatus] = useState<OrderTrackingStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();
  const [confirmTarget, setConfirmTarget] =
    useState<OrderTrackingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const actions = ACTIONS_BY_STATUS[status];

  // Terminal state — nothing more to do
  if (!actions || actions.length === 0) {
    return null;
  }

  function handleAction(action: TrackingAction) {
    if (action.requiresConfirm) {
      setConfirmTarget(action.next);
      setError(null);
      return;
    }
    commit(action.next, action.label);
  }

  function handleConfirm() {
    if (!confirmTarget) return;
    const action = ACTIONS_BY_STATUS[status]?.find(
      (a) => a.next === confirmTarget,
    );
    commit(confirmTarget, action?.label ?? "");
    setConfirmTarget(null);
  }

  function commit(next: OrderTrackingStatus, label: string) {
    const previous = status;
    setError(null);
    setSuccess(null);

    // Optimistic
    setStatus(next);

    startTransition(async () => {
      const result = await updateOrderTrackingStatus(orderId, next);
      if (!result.success) {
        setStatus(previous);
        setError(result.error);
      } else {
        setSuccess(`${label} — status atualizado.`);
      }
    });
  }

  return (
    <div className="space-y-3">
      {/* Feedback */}
      {error && (
        <InlineFeedback
          type="error"
          message={error}
          onDismiss={() => setError(null)}
        />
      )}
      {success && (
        <InlineFeedback
          type="success"
          message={success}
          onDismiss={() => setSuccess(null)}
        />
      )}

      {/* Confirmation prompt */}
      {confirmTarget && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-800 mb-3">
            Tem certeza que deseja cancelar este pedido? Esta ação não pode ser
            desfeita.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              Sim, cancelar
            </button>
            <button
              type="button"
              onClick={() => setConfirmTarget(null)}
              disabled={isPending}
              className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-foreground-muted hover:text-foreground disabled:opacity-50 transition-colors"
            >
              Manter pedido
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!confirmTarget && (
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <button
              key={action.next}
              type="button"
              onClick={() => handleAction(action)}
              disabled={isPending}
              className={[
                "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50",
                action.variant === "primary"
                  ? "bg-accent text-white hover:bg-accent/90"
                  : "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
              ].join(" ")}
            >
              {isPending ? (
                <SpinnerIcon className="h-4 w-4 animate-spin" />
              ) : action.variant === "primary" ? (
                <CheckIcon className="h-4 w-4" />
              ) : (
                <XIcon className="h-4 w-4" />
              )}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
