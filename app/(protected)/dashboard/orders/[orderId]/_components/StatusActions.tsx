"use client";

import { useTransition, useState, useRef, useEffect } from "react";
import { OrderStatus } from "@/domain/order/Order";
import { updateOrderStatus } from "../actions";
import { StatusBadge } from "../../../_components/StatusBadge";

// ─── Types ────────────────────────────────────────────────────────────────────

type ConfirmTarget = OrderStatus.REJECTED | OrderStatus.APPROVED;

// ─── Component ────────────────────────────────────────────────────────────────

interface StatusActionsProps {
  orderId: string;
  currentStatus: OrderStatus;
  /** Pre-computed wa.me URL with the approval message template resolved. */
  approvalWaUrl: string;
  /** Pre-computed wa.me URL with the rejection message template resolved. */
  rejectionWaUrl: string;
}

/**
 * StatusActions — sticky action bar with status badge and transition buttons.
 *
 * UX behaviour:
 *   • Optimistic update — badge flips immediately; reverts on failure.
 *   • Confirmation step — Recusar shows an inline "Tem certeza?" prompt before
 *     committing; avoids accidental rejections.
 *   • Per-button loading — the active button shows a spinner while the Server
 *     Action is in flight; the other button is dimmed.
 *   • Success banner — brief confirmation replaces action row after completion.
 *   • Error banner — shows the domain error message with a dismiss button.
 *
 * Transitions allowed by the domain:
 *   PENDING  → APPROVED | REJECTED
 *   APPROVED → REJECTED
 *   REJECTED → (terminal)
 */
export function StatusActions({
  orderId,
  currentStatus,
  approvalWaUrl,
  rejectionWaUrl,
}: StatusActionsProps) {
  const [isPending, startTransition] = useTransition();

  // Optimistic: reflects the new status before the server round-trip finishes.
  const [displayStatus, setDisplayStatus] =
    useState<OrderStatus>(currentStatus);
  // Which transition is awaiting inline confirmation (null = no confirmation open).
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(
    null,
  );
  // Feedback banners.
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // Track which button triggered the in-flight action for per-button spinner.
  const [activeAction, setActiveAction] = useState<OrderStatus | null>(null);

  /**
   * After a successful status change, hold the WA URL that should be opened.
   * Set to null once opened (manually or via the auto-redirect timer).
   */
  const [pendingWaUrl, setPendingWaUrl] = useState<string | null>(null);

  /**
   * Hidden anchor used to programmatically open the WhatsApp link.
   * Calling .click() on an <a> element is more reliable than window.open()
   * when triggered from an async context (avoids popup blockers).
   */
  const waLinkRef = useRef<HTMLAnchorElement>(null);

  // Auto-open WhatsApp 800 ms after the WA URL becomes available.
  useEffect(() => {
    if (!pendingWaUrl) return;
    const timer = setTimeout(() => {
      waLinkRef.current?.click();
    }, 800);
    return () => clearTimeout(timer);
  }, [pendingWaUrl]);

  const canApprove = displayStatus === OrderStatus.PENDING;
  const canReject =
    displayStatus === OrderStatus.PENDING ||
    displayStatus === OrderStatus.APPROVED;

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleApprove() {
    // Approve is non-destructive — no confirmation needed.
    commit(OrderStatus.APPROVED);
  }

  function handleRejectRequest() {
    // Show inline confirmation before rejecting.
    setConfirmTarget(OrderStatus.REJECTED);
    setError(null);
  }

  function handleConfirm(target: ConfirmTarget) {
    setConfirmTarget(null);
    commit(target);
  }

  function handleCancelConfirm() {
    setConfirmTarget(null);
  }

  function commit(newStatus: OrderStatus) {
    const previous = displayStatus;
    setError(null);
    setSuccess(null);
    setPendingWaUrl(null);
    setActiveAction(newStatus);

    // Optimistic flip.
    setDisplayStatus(newStatus);

    startTransition(async () => {
      const result = await updateOrderStatus(orderId, newStatus);
      setActiveAction(null);

      if (!result.success) {
        // Revert optimistic update.
        setDisplayStatus(previous);
        setError(result.error);
      } else {
        setSuccess(
          newStatus === OrderStatus.APPROVED
            ? "Pedido aprovado!"
            : "Pedido recusado.",
        );
        setPendingWaUrl(
          newStatus === OrderStatus.APPROVED ? approvalWaUrl : rejectionWaUrl,
        );
      }
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="sticky bottom-0 left-0 right-0 z-20 border-t border-line bg-surface/95 backdrop-blur-sm px-4 py-3 sm:relative sm:bottom-auto sm:border sm:rounded-xl sm:bg-surface sm:backdrop-blur-none">
      <div className="mx-auto max-w-2xl flex flex-col gap-3">
        {/* ── Status row ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-foreground-muted">
            Status
          </span>
          <StatusBadge status={displayStatus} size="md" />
        </div>

        {/* ── Success / WA redirect banner ──────────────────────────────── */}
        {success && !isPending && (
          <>
            {/*
             * Hidden anchor: .click() is called programmatically by the
             * useEffect timer. Using an <a> element avoids popup-blocker issues
             * that arise when window.open() is called in an async callback.
             */}
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

            <div
              className={[
                "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-medium",
                displayStatus === OrderStatus.APPROVED
                  ? "bg-green-50 text-green-800"
                  : "bg-surface-hover text-foreground",
              ].join(" ")}
            >
              <span className="flex items-center gap-1.5 min-w-0">
                <CheckCircleIcon className="h-4 w-4 shrink-0" />
                <span className="font-semibold">{success}</span>
                {pendingWaUrl && (
                  <span className="text-foreground-muted truncate">
                    Abrindo WhatsApp…
                  </span>
                )}
              </span>

              {pendingWaUrl ? (
                /* Manual-open button — visible until auto-redirect fires */
                <a
                  href={pendingWaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setPendingWaUrl(null)}
                  className="inline-flex shrink-0 items-center gap-1 font-semibold text-[#25D366] hover:underline"
                >
                  <WhatsAppIcon className="h-3.5 w-3.5" />
                  Abrir agora
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => setSuccess(null)}
                  className="opacity-60 hover:opacity-100 transition-opacity"
                  aria-label="Fechar"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </>
        )}

        {/* ── Error banner ──────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center justify-between gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-danger">
            <span className="flex items-center gap-1.5">
              <AlertIcon className="h-4 w-4 shrink-0" />
              {error}
            </span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Fechar"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* ── Inline confirmation (Recusar) ─────────────────────────────── */}
        {confirmTarget === OrderStatus.REJECTED && (
          <div className="rounded-lg border border-danger/30 bg-red-50/60 px-3 py-2.5 flex flex-col gap-2">
            <p className="text-sm font-medium text-danger leading-snug">
              Recusar este pedido?
            </p>
            <p className="text-xs text-foreground-muted">
              Esta ação não poderá ser desfeita.
            </p>
            <div className="flex gap-2 mt-0.5">
              <button
                type="button"
                onClick={() => handleConfirm(OrderStatus.REJECTED)}
                disabled={isPending}
                className={[
                  "flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2",
                  "bg-danger text-white text-xs font-semibold",
                  "hover:bg-danger/90 transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                ].join(" ")}
              >
                <XIcon className="h-3.5 w-3.5 shrink-0" />
                Confirmar recusa
              </button>
              <button
                type="button"
                onClick={handleCancelConfirm}
                disabled={isPending}
                className={[
                  "rounded-lg px-3 py-2",
                  "border border-line text-xs font-medium text-foreground-muted",
                  "hover:bg-surface-hover transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                ].join(" ")}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* ── Action buttons ────────────────────────────────────────────── */}
        {(canApprove || canReject) && !confirmTarget && !success && (
          <div className="flex gap-2">
            {canApprove && (
              <button
                type="button"
                onClick={handleApprove}
                disabled={isPending}
                className={[
                  "flex-1 flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5",
                  "bg-green-600 text-white text-sm font-semibold",
                  "hover:bg-green-700 active:scale-95 transition-all",
                  "disabled:opacity-60 disabled:cursor-not-allowed",
                ].join(" ")}
              >
                {isPending && activeAction === OrderStatus.APPROVED ? (
                  <SpinnerIcon className="h-4 w-4 shrink-0 animate-spin" />
                ) : (
                  <CheckIcon className="h-4 w-4 shrink-0" />
                )}
                {isPending && activeAction === OrderStatus.APPROVED
                  ? "Aprovando..."
                  : "Aprovar"}
              </button>
            )}
            {canReject && (
              <button
                type="button"
                onClick={handleRejectRequest}
                disabled={isPending}
                className={[
                  "flex-1 flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5",
                  "border border-danger text-danger text-sm font-semibold",
                  "hover:bg-danger/5 active:scale-95 transition-all",
                  "disabled:opacity-60 disabled:cursor-not-allowed",
                ].join(" ")}
              >
                {isPending && activeAction === OrderStatus.REJECTED ? (
                  <SpinnerIcon className="h-4 w-4 shrink-0 animate-spin" />
                ) : (
                  <XIcon className="h-4 w-4 shrink-0" />
                )}
                {isPending && activeAction === OrderStatus.REJECTED
                  ? "Recusando..."
                  : "Recusar"}
              </button>
            )}
          </div>
        )}

        {/* ── Terminal state ────────────────────────────────────────────── */}
        {displayStatus === OrderStatus.REJECTED && !isPending && !success && (
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

function AlertIcon({ className }: { className?: string }) {
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
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
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
      strokeWidth={2.5}
      strokeLinecap="round"
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
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.535 5.858L0 24l6.335-1.509A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.821 9.821 0 0 1-5.002-1.368l-.359-.214-3.721.886.903-3.633-.235-.374A9.817 9.817 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
    </svg>
  );
}
