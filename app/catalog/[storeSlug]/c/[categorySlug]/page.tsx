import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStoreCatalogUseCase } from "@/infra/composition";
import { CatalogHeader } from "../../_components/CatalogHeader";
import { CatalogProductCard } from "../../_components/CatalogProductCard";
import { CatalogEmptyState } from "../../_components/CatalogEmptyState";
import { CatalogPickupInfo } from "../../_components/CatalogPickupInfo";
import { CartFloatingBar } from "../../_components/CartFloatingBar";
import { WhatsappFab } from "../../_components/WhatsappFab";
import { CatalogCategoryTabs } from "../../_components/CatalogCategoryTabs";

export const revalidate = 60;

interface Props {
  params: Promise<{ storeSlug: string; categorySlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { storeSlug, categorySlug } = await params;
  try {
    const catalog = await getStoreCatalogUseCase.execute(
      storeSlug,
      categorySlug,
    );
    const cat = catalog.categories.find((c) => c.slug === categorySlug);
    return {
      title: cat ? `${cat.name} — ${catalog.name}` : catalog.name,
    };
  } catch {
    return { title: "Catálogo não encontrado" };
  }
}

/**
 * Category-filtered catalog page.
 * Route: /catalog/[storeSlug]/c/[categorySlug]
 */
export default async function CategoryCatalogPage({ params }: Props) {
  const { storeSlug, categorySlug } = await params;

  let catalog;
  try {
    catalog = await getStoreCatalogUseCase.execute(storeSlug, categorySlug);
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--color-bg-muted))]">
      <CatalogHeader
        storeName={catalog.name}
        productCount={catalog.products.length}
      />

      {catalog.categories.length > 0 && (
        <CatalogCategoryTabs
          storeSlug={storeSlug}
          categories={catalog.categories}
        />
      )}

      <main className="mx-auto w-full max-w-screen-xl px-4 py-8 pb-28 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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

        <div className="mt-6 max-w-sm">
          <CatalogPickupInfo pickupAddress={catalog.pickupAddress} />
        </div>
      </main>

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

      <CartFloatingBar storeSlug={storeSlug} />
      <WhatsappFab whatsapp={catalog.whatsapp} storeName={catalog.name} />
    </div>
  );
}
