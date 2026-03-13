import { CartHeaderButton } from "./cart/CartHeaderButton";

interface CatalogHeaderProps {
  storeName: string;
  productCount: number;
  storeSlug: string;
}

/**
 * CatalogHeader — top section of the public catalog page.
 *
 * Displays the store name, a friendly subtitle, and a product count badge.
 * Purely presentational — no client state needed.
 */
export function CatalogHeader({
  storeName,
  productCount,
  storeSlug,
}: CatalogHeaderProps) {
  return (
    <>
      <header className="border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))]">
        {/* Thin accent line at the very top */}
        <div
          className="h-1 w-full bg-gradient-to-r from-accent to-accent-hover"
          aria-hidden="true"
        />

        <div className="mx-auto w-full max-w-screen-xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {/* Store name — SEO-important h1 */}
              <h1 className="text-2xl font-bold tracking-tight text-[rgb(var(--color-text))] sm:text-3xl">
                {storeName}
              </h1>
              <p className="mt-1 text-sm text-[rgb(var(--color-text-muted))]">
                Cardápio digital · Faça seu pedido
              </p>
            </div>

            {productCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg-muted))] px-3 py-1 text-xs font-medium text-[rgb(var(--color-text-muted))] self-start sm:self-auto">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-green-500"
                  aria-hidden="true"
                />
                {productCount} {productCount === 1 ? "produto" : "produtos"}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Floating cart button — fixed top-right, always visible */}
      <CartHeaderButton storeSlug={storeSlug} />
    </>
  );
}
