interface CatalogHeaderProps {
  storeName: string;
  productCount: number;
}

/**
 * CatalogHeader — top section of the public catalog page.
 *
 * Displays the store name, a friendly subtitle, and a product count badge.
 * Purely presentational — no client state needed.
 */
export function CatalogHeader({ storeName, productCount }: CatalogHeaderProps) {
  return (
    <header className="border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))]">
      <div className="mx-auto w-full max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {/* Store name — SEO-important h1 */}
            <h1 className="text-2xl font-bold tracking-tight text-[rgb(var(--color-text))] sm:text-3xl">
              {storeName}
            </h1>
            <p className="mt-1 text-sm text-[rgb(var(--color-text-muted))]">
              Cardápio digital · Faça seu pedido pelo WhatsApp
            </p>
          </div>

          {productCount > 0 && (
            <p className="text-sm text-[rgb(var(--color-text-muted))]">
              {productCount}{" "}
              {productCount === 1
                ? "produto disponível"
                : "produtos disponíveis"}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
