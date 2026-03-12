/**
 * DeliverySettings — groups all delivery-related configuration cards.
 *
 * Contains:
 *  - PickupAddressForm   (where customers collect orders)
 *  - CepRangeForm        (delivery zone definition)
 *  - DefaultDeliveryFeeForm (base fee when no range matches)
 *
 * Server Component — data is pre-fetched by page.tsx and passed as props.
 */

import type { StorePickupAddress } from "@/domain/store/types";
import { PickupAddressForm } from "./PickupAddressForm";
import { CepRangeForm } from "./CepRangeForm";
import { DefaultDeliveryFeeForm } from "./DefaultDeliveryFeeForm";
import { CollapsibleSettingsGroup } from "./CollapsibleSettingsGroup";

interface CepRange {
  id: string;
  cepStart: string;
  cepEnd: string;
  deliveryFee: number;
}

interface DeliverySettingsProps {
  pickupAddress: StorePickupAddress | null;
  ranges: CepRange[];
  defaultDeliveryFee: number;
}

export function DeliverySettings({
  pickupAddress,
  ranges,
  defaultDeliveryFee,
}: DeliverySettingsProps) {
  return (
    <CollapsibleSettingsGroup
      title="Entrega"
      description="Configure o endereço de retirada, as faixas de CEP atendidas e a taxa de entrega padrão."
      icon={<TruckIcon className="h-4 w-4" />}
    >
      <PickupAddressForm initialAddress={pickupAddress} />
      <CepRangeForm initialRanges={ranges} />
      <DefaultDeliveryFeeForm initialFee={defaultDeliveryFee} />
    </CollapsibleSettingsGroup>
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
