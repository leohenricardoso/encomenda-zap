import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStoreCatalogUseCase } from "@/infra/composition";
import { CatalogHeader } from "./_components/CatalogHeader";
import { CatalogProductCard } from "./_components/CatalogProductCard";
import { CatalogEmptyState } from "./_components/CatalogEmptyState";
import { CartFloatingBar } from "./_components/CartFloatingBar";

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
      />

      {/* ── Product grid ─────────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-screen-xl px-4 py-8 pb-28 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {catalog.products.length === 0 ? (
            <CatalogEmptyState />
          ) : (
            catalog.products.map((product) => (
              <CatalogProductCard
                key={product.id}
                product={product}
                storeSlug={storeSlug}
              />
            ))
          )}
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

      {/* ── Floating cart bar (Client Component — reads sessionStorage) ─ */}
      <CartFloatingBar storeSlug={storeSlug} />
    </div>
  );
}
