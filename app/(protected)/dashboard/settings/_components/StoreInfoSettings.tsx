/**
 * StoreInfoSettings — groups store identity / contact configuration.
 *
 * Contains:
 *  - StoreIdentityForm  (store name + URL slug)
 *  - WhatsappForm       (store contact number visible on the public catalog)
 *
 * Server Component — data is pre-fetched by page.tsx and passed as props.
 */

import { WhatsappForm } from "./WhatsappForm";
import { StoreIdentityForm } from "./StoreIdentityForm";
import { CollapsibleSettingsGroup } from "./CollapsibleSettingsGroup";

interface StoreInfoSettingsProps {
  currentWhatsapp: string | null;
  storeName: string;
  storeSlug: string;
}

export function StoreInfoSettings({
  currentWhatsapp,
  storeName,
  storeSlug,
}: StoreInfoSettingsProps) {
  return (
    <CollapsibleSettingsGroup
      title="Informações da Loja"
      description="Dados de contato usados no catálogo público e na comunicação com clientes."
      icon={<StoreIcon className="h-4 w-4" />}
    >
      <StoreIdentityForm initialName={storeName} initialSlug={storeSlug} />
      <hr className="border-line" />
      <WhatsappForm initialWhatsapp={currentWhatsapp} />
    </CollapsibleSettingsGroup>
  );
}

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
