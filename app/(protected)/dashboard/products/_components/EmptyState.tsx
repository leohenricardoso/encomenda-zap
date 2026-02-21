/**
 * EmptyState — shown on the products grid when there are no results.
 *
 * Two modes:
 *   no-products — first-time state, CTA to create a product
 *   no-results  — after a filter/search returned nothing, CTA to clear
 */

import Link from "next/link";

interface EmptyStateProps {
  /** Drives the message and CTA. Defaults to "no-products". */
  mode?: "no-products" | "no-results";
}

// ─── Box icon ─────────────────────────────────────────────────────────────────

function BoxIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.25}
      stroke="currentColor"
      className="h-10 w-10"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
      />
    </svg>
  );
}

// ─── Search icon ──────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.25}
      stroke="currentColor"
      className="h-10 w-10"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 15.803a7.5 7.5 0 0 0 10.607 0Z"
      />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EmptyState({ mode = "no-products" }: EmptyStateProps) {
  const isNoResults = mode === "no-results";

  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      {/* Icon */}
      <span className="mb-4 text-[rgb(var(--color-text-muted))]">
        {isNoResults ? <SearchIcon /> : <BoxIcon />}
      </span>

      {/* Heading */}
      <h3 className="text-sm font-semibold text-[rgb(var(--color-text))]">
        {isNoResults ? "Nenhum produto encontrado" : "Nenhum produto ainda"}
      </h3>

      {/* Description */}
      <p className="mt-1 text-sm text-[rgb(var(--color-text-muted))]">
        {isNoResults
          ? "Tente ajustar os filtros ou a busca."
          : "Adicione o primeiro produto do seu catálogo."}
      </p>

      {/* CTA */}
      {!isNoResults && (
        <Link
          href="/dashboard/products/new"
          className={[
            "mt-6 inline-flex items-center gap-2 rounded-lg px-4 py-2",
            "text-sm font-medium",
            "bg-[rgb(var(--color-primary))] text-[rgb(var(--color-primary-foreground))]",
            "hover:opacity-90 transition-opacity",
            "ring-focus",
          ].join(" ")}
        >
          <span aria-hidden="true">+</span>
          Adicionar produto
        </Link>
      )}
    </div>
  );
}
