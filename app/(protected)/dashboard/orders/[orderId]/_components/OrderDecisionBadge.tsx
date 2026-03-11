import { OrderStatus } from "@/domain/order/Order";

// ─── Config ───────────────────────────────────────────────────────────────────

const DECISION_BADGE_CONFIG: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  [OrderStatus.PENDING]: {
    label: "Aguardando decisão",
    className: "bg-amber-100 text-amber-800 border border-amber-200",
  },
  [OrderStatus.APPROVED]: {
    label: "Aceito",
    className: "bg-green-100 text-green-800 border border-green-200",
  },
  [OrderStatus.REJECTED]: {
    label: "Recusado",
    className: "bg-red-100 text-red-800 border border-red-200",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface OrderDecisionBadgeProps {
  status: OrderStatus;
  size?: "sm" | "md";
}

/**
 * OrderDecisionBadge — pill badge for the order's DECISION status
 * (PENDING / APPROVED / REJECTED).
 *
 * Server Component.
 */
export function OrderDecisionBadge({
  status,
  size = "md",
}: OrderDecisionBadgeProps) {
  const { label, className } = DECISION_BADGE_CONFIG[status];
  const sizeClass =
    size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs font-semibold";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full",
        sizeClass,
        className,
      ].join(" ")}
    >
      {status === OrderStatus.APPROVED && (
        <CheckIcon className="mr-1 h-3 w-3" />
      )}
      {status === OrderStatus.REJECTED && <XIcon className="mr-1 h-3 w-3" />}
      {label}
    </span>
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
