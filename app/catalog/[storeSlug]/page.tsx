import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStoreCatalogUseCase } from "@/infra/composition";
import { CatalogHeader } from "./_components/CatalogHeader";
import { CatalogProductList } from "./_components/CatalogProductList";
import { CatalogPickupInfo } from "./_components/CatalogPickupInfo";

import { WhatsappFab } from "./_components/WhatsappFab";
import { CatalogCategoryTabs } from "./_components/CatalogCategoryTabs";

// ─── Revalidation ─────────────────────────────────────────────────────────────
// ISR: serve cached HTML for up to 60 s, regenerate in background.
// Balances SEO freshness with performance — no cold start on each request.
export const revalidate = 60;

// ─── Route params ─────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ storeSlug: string }>;
}

// ─── Dynamic metadata ─────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { storeSlug } = await params;

  try {
    const catalog = await getStoreCatalogUseCase.execute(storeSlug);
    return {
      title: catalog.name,
      description: `Conheça o cardápio digital de ${catalog.name}. Veja produtos, preços e faça seu pedido pelo WhatsApp.`,
      openGraph: {
        title: `${catalog.name} — Cardápio Digital`,
        description: `Explore os produtos de ${catalog.name} e faça seu pedido facilmente.`,
        type: "website",
      },
    };
  } catch {
    // Catalog not found — metadata fallback (page will notFound() below)
    return {
      title: "Catálogo não encontrado",
    };
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

/**
 * Catalog page — public storefront for a specific store.
 *
 * Accessible without authentication.
 * Displays only active products and their active variants.
 * Rendered server-side with ISR — fast initial load, always-fresh content.
 */
export default async function CatalogPage({ params }: Props) {
  const { storeSlug } = await params;

  let catalog;
  try {
    catalog = await getStoreCatalogUseCase.execute(storeSlug);
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--color-bg-muted))]">
      {/* ── Store header ─────────────────────────────────────────────── */}
      <CatalogHeader
        storeName={catalog.name}
        productCount={catalog.products.length}
        storeSlug={storeSlug}
      />

      {/* ── Category tabs ─────────────────────────────────────────────── */}
      {catalog.categories.length > 0 && (
        <CatalogCategoryTabs
          storeSlug={storeSlug}
          categories={catalog.categories}
        />
      )}

      {/* ── Product list ─────────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-screen-xl px-4 py-4 sm:px-6 lg:px-8">
        <CatalogProductList products={catalog.products} storeSlug={storeSlug} />

        {/* ── Pickup address ─────────────────────────────────────────── */}
        <div className="mt-6 max-w-sm">
          <CatalogPickupInfo pickupAddress={catalog.pickupAddress} />
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] py-6 text-center">
        <p className="text-xs text-[rgb(var(--color-text-muted))]">
          Catálogo digital de{" "}
          <span className="font-medium text-[rgb(var(--color-text))]">
            {catalog.name}
          </span>{" "}
          · Powered by{" "}
          <span className="font-medium text-[rgb(var(--color-text))]">
            Encomenda Zap
          </span>
        </p>
      </footer>

      {/* ── WhatsApp FAB — above cart bar, right side ──────────────── */}
      <WhatsappFab whatsapp={catalog.whatsapp} storeName={catalog.name} />
    </div>
  );
}
