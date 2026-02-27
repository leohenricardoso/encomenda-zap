import { FulfillmentType } from "@/domain/order/Order";
import { formatLongDate, formatCep } from "./helpers";
import { SectionTitle } from "./CustomerSection";

// ─── Component ────────────────────────────────────────────────────────────────

interface LogisticsSectionProps {
  fulfillmentType: FulfillmentType;
  deliveryDate: Date;
  pickupTime: string | null;
  // DELIVERY fields
  deliveryCep: string | null;
  deliveryStreet: string | null;
  deliveryNumber: string | null;
  deliveryNeighborhood: string | null;
  deliveryCity: string | null;
  shippingAddress: string | null;
}

/**
 * LogisticsSection — date, fulfillment type, pickup time or delivery address.
 */
export function LogisticsSection({
  fulfillmentType,
  deliveryDate,
  pickupTime,
  deliveryCep,
  deliveryStreet,
  deliveryNumber,
  deliveryNeighborhood,
  deliveryCity,
  shippingAddress,
}: LogisticsSectionProps) {
  const isPickup = fulfillmentType === FulfillmentType.PICKUP;

  const addressLine = isPickup
    ? null
    : [deliveryStreet, deliveryNumber, deliveryNeighborhood, deliveryCity]
        .filter(Boolean)
        .join(", ") ||
      shippingAddress ||
      null;

  return (
    <section aria-label="Logística">
      <SectionTitle icon={<MapPinIcon />}>Logística</SectionTitle>
      <div className="mt-3 rounded-xl border border-line bg-surface divide-y divide-line">
        {/* Type tag */}
        <LogRow
          icon={isPickup ? <StoreIcon /> : <TruckIcon />}
          label="Tipo"
          value={
            <span
              className={[
                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                isPickup
                  ? "bg-blue-100 text-blue-700"
                  : "bg-purple-100 text-purple-700",
              ].join(" ")}
            >
              {isPickup ? "Retirada" : "Entrega"}
            </span>
          }
        />

        {/* Date */}
        <LogRow
          icon={<CalendarIcon />}
          label="Data"
          value={
            <span className="capitalize">{formatLongDate(deliveryDate)}</span>
          }
        />

        {/* Pickup time */}
        {isPickup && pickupTime && (
          <LogRow
            icon={<ClockIcon />}
            label="Horário"
            value={
              <span className="font-semibold tabular-nums">{pickupTime}</span>
            }
          />
        )}

        {/* CEP */}
        {!isPickup && deliveryCep && (
          <LogRow
            icon={<HashIcon />}
            label="CEP"
            value={formatCep(deliveryCep)}
          />
        )}

        {/* Address */}
        {!isPickup && addressLine && (
          <LogRow
            icon={<MapPinIcon />}
            label="Endereço"
            value={
              <span className="text-right leading-snug">{addressLine}</span>
            }
          />
        )}
      </div>
    </section>
  );
}

// ─── LogRow helper ────────────────────────────────────────────────────────────

function LogRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-foreground-muted shrink-0">
        <span className="h-4 w-4 shrink-0">{icon}</span>
        {label}
      </div>
      <div className="text-sm font-medium text-foreground text-right">
        {value}
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function MapPinIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function HashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  );
}
