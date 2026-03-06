import type { StorePickupAddress } from "@/domain/store/types";

// ─── Props ────────────────────────────────────────────────────────────────────

interface CatalogPickupInfoProps {
  pickupAddress: StorePickupAddress | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatAddress(addr: StorePickupAddress): string[] {
  const lines: string[] = [];
  lines.push(addr.locationName);
  lines.push(
    [addr.street, addr.number, addr.neighborhood, addr.city]
      .filter(Boolean)
      .join(", "),
  );
  if (addr.complement) lines.push(addr.complement);
  if (addr.reference) lines.push(`Ref: ${addr.reference}`);
  return lines;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * CatalogPickupInfo — shows the store's configured pickup address in the public
 * catalog, or a fallback message when the address has not yet been configured.
 */
export function CatalogPickupInfo({ pickupAddress }: CatalogPickupInfoProps) {
  const lines = pickupAddress ? formatAddress(pickupAddress) : null;

  return (
    <section
      aria-label="Endereço de retirada"
      className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] px-4 py-4 sm:px-5"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <span className="mt-0.5 shrink-0 h-5 w-5 text-[rgb(var(--color-text-muted))]">
          <MapPinIcon />
        </span>

        <div className="space-y-0.5">
          <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--color-text-muted))]">
            Retirada
          </p>
          {lines ? (
            <div className="text-sm text-[rgb(var(--color-text))]">
              {lines.map((line, i) => (
                <p key={i} className={i === 0 ? "font-medium" : ""}>
                  {line}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[rgb(var(--color-text-muted))]">
              Endereço de retirada será informado após a confirmação do pedido.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Icon ─────────────────────────────────────────────────────────────────────

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
      className="h-5 w-5"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
