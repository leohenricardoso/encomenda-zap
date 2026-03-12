import { FulfillmentType } from "@/domain/order/Order";

// ─── Component ────────────────────────────────────────────────────────────────

interface FulfillmentBadgeProps {
  fulfillmentType: FulfillmentType;
  size?: "sm" | "md";
}

/**
 * FulfillmentBadge — pill badge indicating PICKUP or DELIVERY.
 *
 * PICKUP   → slate/blue pill  "Retirada"
 * DELIVERY → purple pill      "Entrega"
 */
export function FulfillmentBadge({
  fulfillmentType,
  size = "md",
}: FulfillmentBadgeProps) {
  const isPickup = fulfillmentType === FulfillmentType.PICKUP;

  const baseClasses =
    "inline-flex items-center gap-1.5 rounded-full font-semibold";
  const sizeClasses =
    size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs";
  const colorClasses = isPickup
    ? "bg-blue-100 text-blue-700"
    : "bg-purple-100 text-purple-700";

  return (
    <span className={[baseClasses, sizeClasses, colorClasses].join(" ")}>
      {isPickup ? (
        <StoreIcon className="h-3 w-3" />
      ) : (
        <TruckIcon className="h-3 w-3" />
      )}
      {isPickup ? "Retirada" : "Entrega"}
    </span>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function StoreIcon({ className }: { className?: string }) {
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
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
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
