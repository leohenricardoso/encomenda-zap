import type { Metadata } from "next";
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
 * Wraps the stateful OrderReviewClient (Client Component) that reads
 * sessionStorage to display the cart and customer data.
 *
 * Rendering: dynamic — no data fetching here; all state lives on the client.
 */
export const dynamic = "force-dynamic";

export default async function RevisarPage({ params }: Props) {
  const { storeSlug } = await params;
  return <OrderReviewClient storeSlug={storeSlug} />;
}
