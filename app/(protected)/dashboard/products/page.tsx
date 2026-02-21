/**
 * /dashboard/products — Server Component.
 *
 * Responsibilities:
 *   1. Read and validate searchParams (search, status, sort, order).
 *   2. Fetch all products from the use case (storeId from session).
 *   3. Apply filter + sort on the server — avoids a round-trip for filtering.
 *   4. Pass the resulting slice to the grid.
 *
 * "use client" is NOT used here. Only the child components that need
 * interactivity (ProductFilters, ToggleActiveButton, DeleteProductButton) are
 * Client Components.
 */

import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getSession } from "@/infra/http/auth/getSession";
import { listProductsUseCase } from "@/infra/composition";
import type { Product } from "@/domain/product/types";
import { ProductCard } from "./_components/ProductCard";
import { ProductFilters } from "./_components/ProductFilters";
import { EmptyState } from "./_components/EmptyState";

export const metadata: Metadata = { title: "Produtos" };

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusParam = "all" | "active" | "inactive";
type SortField = "name" | "price" | "createdAt";
type SortOrder = "asc" | "desc";

interface SearchParams {
  search?: string;
  status?: string;
  sort?: string;
  order?: string;
}

// ─── Filter + sort ────────────────────────────────────────────────────────────

function applyFilters(
  products: Product[],
  { search, status, sort, order }: SearchParams,
): Product[] {
  let result = [...products];

  // Search by name (case-insensitive, accent-agnostic)
  if (search?.trim()) {
    const term = search.trim().toLowerCase();
    result = result.filter((p) => p.name.toLowerCase().includes(term));
  }

  // Status filter
  const statusFilter = (status ?? "all") as StatusParam;
  if (statusFilter === "active") {
    result = result.filter((p) => p.isActive);
  } else if (statusFilter === "inactive") {
    result = result.filter((p) => !p.isActive);
  }

  // Sort
  const sortField: SortField = (
    ["name", "price", "createdAt"].includes(sort ?? "") ? sort : "createdAt"
  ) as SortField;
  const sortOrder: SortOrder = order === "asc" ? "asc" : "desc";
  const dir = sortOrder === "asc" ? 1 : -1;

  result.sort((a, b) => {
    if (sortField === "name") {
      return dir * a.name.localeCompare(b.name, "pt-BR");
    }
    if (sortField === "price") {
      return dir * (a.price - b.price);
    }
    // createdAt
    return dir * (a.createdAt.getTime() - b.createdAt.getTime());
  });

  return result;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  searchParams: Promise<SearchParams>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const session = await getSession();
  const params = await searchParams;

  // Fetch all products (use case returns store-scoped list)
  const allProducts = await listProductsUseCase.execute(session.storeId);

  // Apply filter + sort on the server
  const products = applyFilters(allProducts, params);

  // Determine whether the empty state is "first time" or "no results from filter"
  const hasActiveFilters = !!(
    params.search ||
    (params.status && params.status !== "all") ||
    params.sort
  );

  return (
    /*
     * Page container — comfortable horizontal padding scales with viewport.
     * max-w-screen-xl keeps wide monitors readable.
     */
    <div className="mx-auto w-full max-w-screen-xl px-4 py-8 md:px-6 lg:px-8">
      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[rgb(var(--color-text))]">
            Produtos
          </h1>
          <p className="mt-0.5 text-sm text-[rgb(var(--color-text-muted))]">
            Gerencie os produtos do seu catálogo
          </p>
        </div>

        {/* CTA — full-width on mobile, auto on sm+ */}
        <Link
          href="/dashboard/products/new"
          className={[
            "inline-flex items-center justify-center gap-2 rounded-lg",
            "px-4 py-2.5 text-sm font-medium",
            "bg-[rgb(var(--color-primary))] text-[rgb(var(--color-primary-foreground))]",
            "transition-opacity hover:opacity-90",
            "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-2",
            "sm:w-auto w-full",
          ].join(" ")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
          Novo produto
        </Link>
      </div>

      {/* ── Filters bar ────────────────────────────────────────────────── */}
      {/*
       * Suspense is required because ProductFilters calls useSearchParams()
       * on the client. Without it, Next.js 15 throws during static rendering.
       */}
      <div className="mb-6">
        <Suspense fallback={<FiltersSkeleton />}>
          <ProductFilters />
        </Suspense>
      </div>

      {/* ── Count label ─────────────────────────────────────────────────── */}
      {allProducts.length > 0 && (
        <p className="mb-4 text-xs text-[rgb(var(--color-text-muted))]">
          {products.length === allProducts.length ? (
            <>
              {allProducts.length}{" "}
              {allProducts.length === 1 ? "produto" : "produtos"}
            </>
          ) : (
            <>
              {products.length} de {allProducts.length} produtos
            </>
          )}
        </p>
      )}

      {/* ── Products grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.length === 0 ? (
          <EmptyState mode={hasActiveFilters ? "no-results" : "no-products"} />
        ) : (
          products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              isActive={product.isActive}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Skeleton for the filters bar ────────────────────────────────────────────

function FiltersSkeleton() {
  return (
    <div className="flex animate-pulse gap-3">
      <div className="h-9 flex-1 rounded-lg bg-[rgb(var(--color-bg-muted))]" />
      <div className="h-9 w-48 rounded-lg bg-[rgb(var(--color-bg-muted))]" />
      <div className="h-9 w-36 rounded-lg bg-[rgb(var(--color-bg-muted))]" />
    </div>
  );
}
