import type { Metadata } from "next";
import { getStoreCatalogUseCase } from "@/infra/composition";
import type { StorePickupAddress } from "@/domain/store/types";
import { OrderReviewClient } from "./_components/OrderReviewClient";

// ─── Route params ─────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ storeSlug: string }>;
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { storeSlug } = await params;
  return {
    title: "Revisar pedido",
    description: `Revise e confirme o seu pedido antes de enviá-lo.`,
    robots: { index: false },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

/**
 * /catalog/[storeSlug]/pedido/revisar
 *
 * Public page — no auth required.
 * Loads store catalog to surface the configured pickup address for the client.
 */
export const dynamic = "force-dynamic";

export default async function RevisarPage({ params }: Props) {
  const { storeSlug } = await params;

  let pickupAddress: StorePickupAddress | null = null;
  try {
    const catalog = await getStoreCatalogUseCase.execute(storeSlug);
    pickupAddress = catalog.pickupAddress;
  } catch {
    // Store not found or DB error — proceed without address
  }

  return (
    <OrderReviewClient
      storeSlug={storeSlug}
      initialPickupAddress={pickupAddress}
    />
  );
}
