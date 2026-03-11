"use client";

/**
 * OrderCardQuickActions — inline approve / reject / WhatsApp buttons.
 *
 * Client Component: uses useTransition for optimistic status updates via
 * the updateOrderStatus Server Action.
 *
 * Rejection requires a two-step inline confirmation to prevent accidental
 * actions — matching the UX of the existing detail page StatusActions.
 */

import { useTransition, useState } from "react";
import { OrderStatus } from "@/domain/order/Order";
import { updateOrderStatus } from "../orders/[orderId]/actions";
import { whatsAppUrl } from "../orders/[orderId]/_components/helpers";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderCardQuickActionsProps {
  orderId: string;
  initialStatus: OrderStatus;
  customerWhatsapp: string;
  customerName: string;
  orderNumber: number | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OrderCardQuickActions({
  orderId,
  initialStatus,
  customerWhatsapp,
  customerName,
  orderNumber,
}: OrderCardQuickActionsProps) {
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();
  const [confirmReject, setConfirmReject] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canApprove = status === OrderStatus.PENDING;
  const canReject =
    status === OrderStatus.PENDING || status === OrderStatus.APPROVED;

  const waUrl = whatsAppUrl(customerWhatsapp, customerName, orderNumber);

  // ── Approve ────────────────────────────────────────────────────────────────

  function handleApprove(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setConfirmReject(false);

    startTransition(async () => {
      const res = await updateOrderStatus(orderId, OrderStatus.APPROVED);
      if (res.success) {
        setStatus(OrderStatus.APPROVED);
      } else {
        setError(res.error);
      }
    });
  }

  // ── Reject ─────────────────────────────────────────────────────────────────

  function handleRejectRequest(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setConfirmReject(true);
    setError(null);
  }

  function handleRejectConfirm(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setError(null);

    startTransition(async () => {
      const res = await updateOrderStatus(orderId, OrderStatus.REJECTED);
      if (res.success) {
        setStatus(OrderStatus.REJECTED);
        setConfirmReject(false);
      } else {
        setError(res.error);
        setConfirmReject(false);
      }
    });
  }

  function handleRejectCancel(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setConfirmReject(false);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (status === OrderStatus.REJECTED) return null;

  if (status === OrderStatus.APPROVED && !canReject) return null;

  return (
    // onClick/preventDefault here stops card-link from activating when
    // tapping anywhere inside this actions bar on touch devices.
    // Individual buttons also stopPropagation for precision.
    <div
      className="flex flex-wrap items-center gap-2"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {/* Error feedback */}
      {error && <p className="w-full text-xs text-danger">{error}</p>}

      {/* ── Rejection confirmation state ── */}
      {confirmReject ? (
        <>
          <span className="text-xs text-foreground-muted">
            Confirmar recusa?
          </span>
          <button
            type="button"
            onClick={handleRejectConfirm}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-danger px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? (
              <SpinnerIcon className="h-3 w-3 animate-spin" />
            ) : null}
            Sim, recusar
          </button>
          <button
            type="button"
            onClick={handleRejectCancel}
            disabled={isPending}
            className="inline-flex items-center rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-foreground-muted transition-colors hover:text-foreground disabled:opacity-50"
          >
            Cancelar
          </button>
        </>
      ) : (
        <>
          {/* ── Approve button ── */}
          {canApprove && (
            <button
              type="button"
              onClick={handleApprove}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? (
                <SpinnerIcon className="h-3 w-3 animate-spin" />
              ) : (
                <CheckIcon className="h-3 w-3" />
              )}
              Aprovar
            </button>
          )}

          {/* ── Reject button ── */}
          {canReject && (
            <button
              type="button"
              onClick={handleRejectRequest}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-danger transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              <XIcon className="h-3 w-3" />
              Recusar
            </button>
          )}
        </>
      )}

      {/* ── WhatsApp button (always visible) ── */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-[#25D366] transition-colors hover:bg-[#25D366]/10"
        aria-label={`Contatar ${customerName} via WhatsApp`}
      >
        <WhatsAppIcon className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">WhatsApp</span>
      </a>
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
