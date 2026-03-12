/**
 * Category domain model — pure TypeScript, no Prisma, no Next.js, no HTTP.
 *
 * A Category organises products within a store's public catalog.
 * Multi-tenancy: storeId is present on both entity and join model so every
 * query remains tenant-scoped even when categories are fetched independently.
 */

// ─── Category entity ──────────────────────────────────────────────────────────

export interface Category {
  id: string;
  storeId: string;
  name: string;
  /** URL-safe slug used in the catalog URL: /catalog/:storeSlug/c/:categorySlug */
  slug: string;
  /** Display order in the catalog tab bar and admin list (lower = first). */
  position: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── ProductCategory join entity ──────────────────────────────────────────────

export interface ProductCategory {
  id: string;
  productId: string;
  categoryId: string;
  /** Denormalised from Product for tenant-scoped queries */
  storeId: string;
  /** Display order within this specific category (lower = first) */
  position: number;
  createdAt: Date;
}

// ─── Input types ──────────────────────────────────────────────────────────────

export interface CreateCategoryInput {
  storeId: string;
  name: string;
  /** If omitted the use case generates from name. */
  slug?: string;
  position?: number;
  isActive?: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  isActive?: boolean;
}

/** Lightweight public projection returned by list/detail queries. */
export interface CategorySummary {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  position: number;
  isActive: boolean;
  /** Number of active products assigned to this category. */
  productCount: number;
}
