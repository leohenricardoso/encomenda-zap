import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStoreCatalogUseCase } from "@/infra/composition";
import { CatalogHeader } from "../_components/CatalogHeader";
import { CartFloatingBar } from "../_components/CartFloatingBar";
import { WhatsappFab } from "../_components/WhatsappFab";
import { ProductDetailClient } from "../_components/ProductDetailClient";

// ─── Revalidation ─────────────────────────────────────────────────────────────

export const revalidate = 60;

// ─── Route params ─────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ storeSlug: string; productId: string }>;
}

// ─── Dynamic metadata ─────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { storeSlug, productId } = await params;

  try {
    const catalog = await getStoreCatalogUseCase.execute(storeSlug);
    const product = catalog.products.find((p) => p.id === productId);
    if (!product) return { title: "Produto não encontrado" };

    return {
      title: `${product.name} — ${catalog.name}`,
      description:
        product.description ??
        `Veja detalhes e faça seu pedido de ${product.name} no catálogo de ${catalog.name}.`,
      openGraph: {
        title: `${product.name} — ${catalog.name}`,
        description:
          product.description ??
          `Conheça ${product.name} e faça seu pedido facilmente.`,
        images: product.mainImageUrl ? [product.mainImageUrl] : [],
        type: "website",
      },
    };
  } catch {
    return { title: "Produto não encontrado" };
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

/**
 * Product detail page — public catalog view for a single product.
 *
 * Reuses the same catalog data as the listing page (ISR-cached).
 * Renders CatalogHeader + CartFloatingBar for visual continuity with the catalog.
 */
export default async function ProductDetailPage({ params }: Props) {
  const { storeSlug, productId } = await params;

  let catalog;
  try {
    catalog = await getStoreCatalogUseCase.execute(storeSlug);
  } catch {
    notFound();
  }

  const product = catalog.products.find((p) => p.id === productId);
  if (!product) notFound();

  return (
    <div className="min-h-screen bg-[rgb(var(--color-bg-muted))]">
      {/* ── Store header ─────────────────────────────────────────────── */}
      <CatalogHeader
        storeName={catalog.name}
        productCount={catalog.products.length}
      />

      {/* ── Product detail ───────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-screen-xl px-4 py-8 pb-28 sm:px-6 lg:px-8">
        <ProductDetailClient product={product} storeSlug={storeSlug} />
      </main>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] py-6 text-center">
        <p className="text-xs text-[rgb(var(--color-text-muted))]">
          Catálogo digital de{" "}
          <span className="font-medium text-[rgb(var(--color-text))]">
            {catalog.name}
          </span>
        </p>
      </footer>

      {/* ── Floating cart bar ─────────────────────────────────────────── */}
      <CartFloatingBar storeSlug={storeSlug} />

      {/* ── WhatsApp FAB ──────────────────────────────────────────────── */}
      <WhatsappFab whatsapp={catalog.whatsapp} storeName={catalog.name} />
    </div>
  );
}
