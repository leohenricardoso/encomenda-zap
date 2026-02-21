import Link from "next/link";

export const metadata = { title: "Loja não encontrada" };

/**
 * Shown when /catalog/:storeSlug doesn't match any active store.
 */
export default function CatalogNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[rgb(var(--color-bg-muted))] px-4 text-center">
      <p className="text-5xl font-bold text-[rgb(var(--color-text))]">404</p>
      <h1 className="mt-4 text-xl font-semibold text-[rgb(var(--color-text))]">
        Loja não encontrada
      </h1>
      <p className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">
        O link que você acessou não corresponde a nenhuma loja ativa.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] px-5 py-2.5 text-sm font-medium text-[rgb(var(--color-text))] transition-colors hover:bg-[rgb(var(--color-bg-muted))] ring-focus"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
