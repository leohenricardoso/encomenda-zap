"use client";

/**
 * OrderStatusManager — unified status section for the order detail page.
 *
 * Placed as the FIRST content section so store staff immediately see the
 * current order state and their available next actions.
 *
 * Handles every lifecycle transition in a single component:
 *   pending           → Aprovar (awaiting_payment) | Rejeitar
 *   awaiting_payment  → Marcar como Pago | Rejeitar
 *   paid              → Marcar como Entregue
 *   delivered         → terminal (read-only)
 *   rejected          → terminal (read-only)
 *   cancelled         → terminal (read-only)
 *
 * UX patterns:
 *   • Every action opens a confirmation dialog before executing.
 *   • Optimistic status update — badge & tracker flip immediately.
 *   • Reverts on failure with an inline error banner.
 *   • WhatsApp deep-link opens automatically after approve/reject.
 *   • Visual progress tracker (OrderStatusTracker) shown when APPROVED.
 */

import { useTransition, useState, useRef, useEffect } from "react";
import { OrderStatus, OrderTrackingStatus } from "@/domain/order/Order";
import {
  updateOrderStatus,
  updateOrderTrackingStatus,
} from "../orders/[orderId]/actions";
import {
  getUnifiedStatus,
  UNIFIED_STATUS_CONFIG,
  type UnifiedStatus,
} from "./StatusBadge";
import { OrderStatusTracker } from "../orders/[orderId]/_components/OrderStatusTracker";
import { InlineFeedback } from "../../../_components/InlineFeedback";

// ─── Action definitions ───────────────────────────────────────────────────────

type ActionKey = "approve" | "mark_paid" | "mark_delivered" | "reject";

interface ActionDef {
  key: ActionKey;
  label: string;
  variant: "green" | "blue" | "red" | "ghost";
  dialogTitle: string;
  dialogMessage: string;
}

const ALL_ACTIONS: Record<ActionKey, ActionDef> = {
  approve: {
    key: "approve",
    label: "Aprovar pedido",
    variant: "green",
    dialogTitle: "Confirmar aprovação",
    dialogMessage:
      "Isso aprovará o pedido e o marcará como aguardando pagamento do cliente.",
  },
  mark_paid: {
    key: "mark_paid",
    label: "Marcar como Pago",
    variant: "green",
    dialogTitle: "Confirmar recebimento de pagamento",
    dialogMessage:
      "Isso marcará o pedido como pago e pronto para preparação ou entrega.",
  },
  mark_delivered: {
    key: "mark_delivered",
    label: "Marcar como Entregue",
    variant: "blue",
    dialogTitle: "Confirmar entrega",
    dialogMessage:
      "Isso marcará o pedido como entregue e finalizará o pedido. Esta ação não pode ser desfeita.",
  },
  reject: {
    key: "reject",
    label: "Rejeitar pedido",
    variant: "red",
    dialogTitle: "Rejeitar pedido",
    dialogMessage:
      "Isso recusará o pedido. Use apenas se o pedido não puder ser atendido. Esta ação não pode ser desfeita.",
  },
};

/** Returns the ordered list of actions available for a given unified status. */
function actionsForStatus(unified: UnifiedStatus): ActionDef[] {
  switch (unified) {
    case "pending":
      return [ALL_ACTIONS.approve, ALL_ACTIONS.reject];
    case "awaiting_payment":
      return [ALL_ACTIONS.mark_paid, ALL_ACTIONS.reject];
    case "paid":
      return [ALL_ACTIONS.mark_delivered];
    default:
      return []; // delivered / rejected / cancelled — terminal
  }
}

// ─── Button styles ────────────────────────────────────────────────────────────

const BUTTON_CLASSES: Record<ActionDef["variant"], string> = {
  green: [
    "flex items-center justify-center gap-2 rounded-xl px-5 py-2.5",
    "bg-green-600 text-white text-sm font-semibold",
    "hover:bg-green-700 active:scale-[0.98] transition-all",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ].join(" "),
  blue: [
    "flex items-center justify-center gap-2 rounded-xl px-5 py-2.5",
    "bg-blue-600 text-white text-sm font-semibold",
    "hover:bg-blue-700 active:scale-[0.98] transition-all",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ].join(" "),
  red: [
    "flex items-center justify-center gap-2 rounded-xl px-5 py-2.5",
    "border border-red-200 bg-red-50 text-red-700 text-sm font-semibold",
    "hover:bg-red-100 active:scale-[0.98] transition-all",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ].join(" "),
  ghost: [
    "flex items-center justify-center gap-2 rounded-xl px-5 py-2.5",
    "border border-line bg-surface text-foreground-muted text-sm font-medium",
    "hover:bg-surface-hover transition-colors",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ].join(" "),
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface OrderStatusManagerProps {
  orderId: string;
  initialDecisionStatus: OrderStatus;
  initialTrackingStatus: OrderTrackingStatus | null;
  /** Pre-computed wa.me URL for the approval WhatsApp message. */
  approvalWaUrl: string;
  /** Pre-computed wa.me URL for the rejection WhatsApp message. */
  rejectionWaUrl: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OrderStatusManager({
  orderId,
  initialDecisionStatus,
  initialTrackingStatus,
  approvalWaUrl,
  rejectionWaUrl,
}: OrderStatusManagerProps) {
  const [decisionStatus, setDecisionStatus] = useState<OrderStatus>(
    initialDecisionStatus,
  );
  const [trackingStatus, setTrackingStatus] =
    useState<OrderTrackingStatus | null>(initialTrackingStatus);
  const [isPending, startTransition] = useTransition();
  const [dialogAction, setDialogAction] = useState<ActionDef | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingWaUrl, setPendingWaUrl] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const waLinkRef = useRef<HTMLAnchorElement>(null);

  // Auto-open WhatsApp ~800 ms after approve / reject completes
  useEffect(() => {
    if (!pendingWaUrl) return;
    const t = setTimeout(() => waLinkRef.current?.click(), 800);
    return () => clearTimeout(t);
  }, [pendingWaUrl]);

  const unified = getUnifiedStatus(decisionStatus, trackingStatus);
  const { label: statusLabel, badgeClass } = UNIFIED_STATUS_CONFIG[unified];
  const availableActions = actionsForStatus(unified);

  // ── Execution ─────────────────────────────────────────────────────────────

  function handleActionClick(action: ActionDef) {
    setError(null);
    setSuccess(null);
    setDialogAction(action);
  }

  function handleDialogCancel() {
    setDialogAction(null);
  }

  function handleDialogConfirm() {
    if (!dialogAction) return;
    const action = dialogAction;
    setDialogAction(null);

    const previousDecision = decisionStatus;
    const previousTracking = trackingStatus;

    function revert() {
      setDecisionStatus(previousDecision);
      setTrackingStatus(previousTracking);
    }

    startTransition(async () => {
      if (action.key === "approve") {
        // Optimistic
        setDecisionStatus(OrderStatus.APPROVED);
        setTrackingStatus(OrderTrackingStatus.PENDING);

        const res = await updateOrderStatus(orderId, OrderStatus.APPROVED);
        if (!res.success) {
          revert();
          setError(res.error);
        } else {
          setSuccess("Pedido aprovado com sucesso!");
          setPendingWaUrl(approvalWaUrl);
        }
      } else if (action.key === "reject") {
        // Optimistic
        setDecisionStatus(OrderStatus.REJECTED);
        setTrackingStatus(null);

        const res = await updateOrderStatus(orderId, OrderStatus.REJECTED);
        if (!res.success) {
          revert();
          setError(res.error);
        } else {
          setSuccess("Pedido rejeitado.");
          setPendingWaUrl(rejectionWaUrl);
        }
      } else if (action.key === "mark_paid") {
        // Optimistic
        setTrackingStatus(OrderTrackingStatus.PAID);

        const res = await updateOrderTrackingStatus(
          orderId,
          OrderTrackingStatus.PAID,
        );
        if (!res.success) {
          revert();
          setError(res.error);
        } else {
          setSuccess("Pagamento registrado com sucesso!");
        }
      } else if (action.key === "mark_delivered") {
        // Optimistic
        setTrackingStatus(OrderTrackingStatus.DELIVERED);

        const res = await updateOrderTrackingStatus(
          orderId,
          OrderTrackingStatus.DELIVERED,
        );
        if (!res.success) {
          revert();
          setError(res.error);
        } else {
          setSuccess("Pedido marcado como entregue!");
        }
      }
    });
  }

  // ── Terminal states ───────────────────────────────────────────────────────

  const terminalConfig: Partial<
    Record<
      UnifiedStatus,
      { icon: React.ReactNode; message: string; color: string }
    >
  > = {
    delivered: {
      icon: <CheckCircleIcon className="h-5 w-5 text-blue-600" />,
      message: "Pedido entregue com sucesso.",
      color: "bg-blue-50 border-blue-200 text-blue-800",
    },
    rejected: {
      icon: <XCircleIcon className="h-5 w-5 text-red-500" />,
      message: "Pedido rejeitado.",
      color: "bg-red-50 border-red-200 text-red-700",
    },
    cancelled: {
      icon: <BanIcon className="h-5 w-5 text-foreground-muted" />,
      message: "Pedido cancelado após aprovação.",
      color: "bg-surface-hover border-line text-foreground-muted",
    },
  };

  const terminal = terminalConfig[unified];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Hidden WA anchor for auto-open */}
      {pendingWaUrl && (
        <a
          ref={waLinkRef}
          href={pendingWaUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setPendingWaUrl(null)}
          aria-hidden="true"
          tabIndex={-1}
          className="sr-only"
        />
      )}

      {/* ── Status Management Card ─────────────────────────────────────── */}
      <section
        aria-label="Gerenciamento de status"
        className="rounded-xl border border-line bg-surface overflow-hidden"
      >
        {/* Header strip */}
        <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-foreground-muted mb-1">
              Status do pedido
            </p>
            <span
              className={[
                "inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold",
                badgeClass,
              ].join(" ")}
            >
              {statusLabel}
            </span>
          </div>
          {/* Status icon for visual reinforcement */}
          <StatusIcon unified={unified} />
        </div>

        {/* Progress tracker — collapsible, collapsed by default */}
        {decisionStatus === OrderStatus.APPROVED && (
          <div className="border-t border-line">
            <button
              type="button"
              onClick={() => setIsHistoryOpen((prev) => !prev)}
              className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-surface-hover transition-colors"
              aria-expanded={isHistoryOpen}
              aria-controls="status-history-content"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Histórico de Status
                </p>
                <p className="text-xs text-foreground-muted">
                  Ver alterações de status
                </p>
              </div>
              <ChevronDownIcon
                className={[
                  "h-4 w-4 text-foreground-muted transition-transform duration-200",
                  isHistoryOpen ? "rotate-180" : "",
                ].join(" ")}
              />
            </button>
            <div
              id="status-history-content"
              className={[
                "grid transition-[grid-template-rows] duration-200",
                isHistoryOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              ].join(" ")}
            >
              <div className="overflow-hidden">
                <div className="px-5 pb-5">
                  <OrderStatusTracker
                    currentStatus={
                      trackingStatus ?? OrderTrackingStatus.PENDING
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feedback banners */}
        {(error || success || pendingWaUrl) && (
          <div className="px-5 pb-4 space-y-2">
            {error && (
              <InlineFeedback
                type="error"
                message={error}
                onDismiss={() => setError(null)}
                compact
              />
            )}
            {success && !isPending && (
              <div className="flex items-center justify-between gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                <span className="flex items-center gap-1.5 text-xs font-medium text-green-800">
                  <CheckCircleIcon className="h-4 w-4 shrink-0 text-green-600" />
                  {success}
                  {pendingWaUrl && (
                    <span className="text-green-600 ml-1">
                      Abrindo WhatsApp…
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {pendingWaUrl && (
                    <a
                      href={pendingWaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setPendingWaUrl(null)}
                      className="text-xs font-semibold text-[#25D366] hover:underline flex items-center gap-1"
                    >
                      <WhatsAppIcon className="h-3.5 w-3.5" />
                      Abrir agora
                    </a>
                  )}
                  {!pendingWaUrl && (
                    <button
                      type="button"
                      onClick={() => setSuccess(null)}
                      aria-label="Fechar"
                      className="text-green-600 opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <XIcon className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Terminal state banner */}
        {terminal && (
          <div
            className={[
              "mx-5 mb-5 flex items-center gap-3 rounded-lg border px-4 py-3",
              terminal.color,
            ].join(" ")}
          >
            {terminal.icon}
            <p className="text-sm font-medium">{terminal.message}</p>
          </div>
        )}

        {/* Action buttons */}
        {availableActions.length > 0 && !success && (
          <div className="border-t border-line flex flex-wrap gap-3 px-5 py-4">
            {availableActions.map((action) => (
              <button
                key={action.key}
                type="button"
                onClick={() => handleActionClick(action)}
                disabled={isPending}
                className={BUTTON_CLASSES[action.variant]}
              >
                {isPending ? (
                  <SpinnerIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <ActionIcon actionKey={action.key} className="h-4 w-4" />
                )}
                {action.label}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── Confirmation dialog ────────────────────────────────────────── */}
      {dialogAction && (
        <ConfirmationDialog
          action={dialogAction}
          onConfirm={handleDialogConfirm}
          onCancel={handleDialogCancel}
          isPending={isPending}
        />
      )}
    </>
  );
}

// ─── ConfirmationDialog ───────────────────────────────────────────────────────

interface ConfirmationDialogProps {
  action: ActionDef;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function ConfirmationDialog({
  action,
  onConfirm,
  onCancel,
  isPending,
}: ConfirmationDialogProps) {
  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  const isDestructive = action.variant === "red";

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
    >
      {/* Scrim */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-line bg-surface shadow-xl p-6 space-y-4">
        {/* Icon + Title */}
        <div className="flex items-start gap-3">
          <div
            className={[
              "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              isDestructive ? "bg-red-100" : "bg-green-100",
            ].join(" ")}
          >
            <ActionIcon
              actionKey={action.key}
              className={[
                "h-5 w-5",
                isDestructive ? "text-red-600" : "text-green-700",
              ].join(" ")}
            />
          </div>
          <div>
            <h2
              id="dialog-title"
              className="text-base font-semibold text-foreground"
            >
              {action.dialogTitle}
            </h2>
            <p
              id="dialog-description"
              className="mt-1 text-sm text-foreground-muted leading-relaxed"
            >
              {action.dialogMessage}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 flex items-center justify-center rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium text-foreground-muted hover:bg-surface-hover disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={[
              "flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isDestructive
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-black text-white",
            ].join(" ")}
            autoFocus
          >
            {isPending ? (
              <SpinnerIcon className="h-4 w-4 animate-spin" />
            ) : null}
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── StatusIcon — visual reinforcement beside the status label ────────────────

function StatusIcon({ unified }: { unified: UnifiedStatus }) {
  const configs: Record<UnifiedStatus, { bg: string; icon: React.ReactNode }> =
    {
      pending: {
        bg: "bg-amber-100",
        icon: <ClockIcon className="h-5 w-5 text-amber-700" />,
      },
      awaiting_payment: {
        bg: "bg-orange-100",
        icon: <BanknoteIcon className="h-5 w-5 text-orange-600" />,
      },
      paid: {
        bg: "bg-green-100",
        icon: <CheckCircleIcon className="h-5 w-5 text-green-700" />,
      },
      delivered: {
        bg: "bg-blue-100",
        icon: <TruckIcon className="h-5 w-5 text-blue-600" />,
      },
      cancelled: {
        bg: "bg-surface-hover",
        icon: <BanIcon className="h-5 w-5 text-foreground-muted" />,
      },
      rejected: {
        bg: "bg-red-100",
        icon: <XCircleIcon className="h-5 w-5 text-red-500" />,
      },
    };
  const { bg, icon } = configs[unified];
  return (
    <div
      className={[
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
        bg,
      ].join(" ")}
    >
      {icon}
    </div>
  );
}

// ─── ActionIcon ───────────────────────────────────────────────────────────────

function ActionIcon({
  actionKey,
  className,
}: {
  actionKey: ActionKey;
  className?: string;
}) {
  switch (actionKey) {
    case "approve":
      return <CheckIcon className={className} />;
    case "mark_paid":
      return <BanknoteIcon className={className} />;
    case "mark_delivered":
      return <TruckIcon className={className} />;
    case "reject":
      return <XIcon className={className} />;
  }
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

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
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

function XCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function BanknoteIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function BanIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
