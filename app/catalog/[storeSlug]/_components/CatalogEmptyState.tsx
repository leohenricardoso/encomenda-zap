/**
 * CatalogEmptyState — shown when the store has no active products yet.
 */
export function CatalogEmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      {/* Icon */}
      <div
        aria-hidden="true"
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgb(var(--color-bg-muted))]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-8 w-8 text-[rgb(var(--color-text-muted))]"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"
          />
        </svg>
      </div>

      <p className="text-base font-medium text-[rgb(var(--color-text))]">
        Nenhum produto disponível
      </p>
      <p className="mt-1 text-sm text-[rgb(var(--color-text-muted))]">
        O catálogo desta loja ainda não possui produtos cadastrados.
      </p>
    </div>
  );
}
