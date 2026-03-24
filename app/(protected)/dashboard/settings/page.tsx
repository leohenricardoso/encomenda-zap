/**
 * /dashboard/settings — Store settings page (Server Component).
 *
 * Fetches all store configuration in parallel and renders the settings
 * grouped into logical sections. Each section is handled by a dedicated
 * composition component that delegates interactivity to its client-side
 * form children.
 */

import { getSession } from "@/infra/http/auth/getSession";
import {
  getCepRangeUseCase,
  getStoreWhatsappUseCase,
  getStorePickupAddressUseCase,
  getStoreIdentityUseCase,
  storeRepo,
} from "@/infra/composition";
import { DeliverySettings } from "./_components/DeliverySettings";
import { StoreInfoSettings } from "./_components/StoreInfoSettings";
import { ContactSettings } from "./_components/ContactSettings";

export default async function SettingsPage() {
  const session = await getSession();

  const [ranges, currentWhatsapp, pickupAddress, defaultDeliveryFee, identity] =
    await Promise.all([
      getCepRangeUseCase.execute(session.storeId),
      getStoreWhatsappUseCase.execute(session.storeId),
      getStorePickupAddressUseCase.execute(session.storeId),
      storeRepo.findDefaultDeliveryFee(session.storeId),
      getStoreIdentityUseCase.execute(session.storeId),
    ]);

  return (
    <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl space-y-3">
        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="space-y-1 pb-2 border-b border-line mb-4">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Configurações
          </h1>
          <p className="text-sm text-foreground-muted">
            Gerencie as configurações da sua loja e preferências de entrega.
          </p>
        </div>

        {/* ── Entrega ──────────────────────────────────────────────────────── */}
        <DeliverySettings
          pickupAddress={pickupAddress}
          ranges={ranges.map((r) => ({
            id: r.id,
            cepStart: r.cepStart,
            cepEnd: r.cepEnd,
            deliveryFee: r.deliveryFee,
          }))}
          defaultDeliveryFee={defaultDeliveryFee}
        />

        {/* ── Informações da loja ──────────────────────────────────────────── */}
        <StoreInfoSettings
          currentWhatsapp={currentWhatsapp}
          storeName={identity.name}
          storeSlug={identity.slug ?? ""}
        />

        {/* ── Mensagens ───────────────────────────────────────────────────── */}
        <ContactSettings />
      </div>
    </main>
  );
}
