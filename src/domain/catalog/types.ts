import type { PricingType } from "@/domain/product/Product";

/**
 * Catalog domain types — public-facing, read-only view of a store's offering.
 *
 * These types intentionally mirror the Product/ProductVariant domain entities
 * but carry only the fields needed for display to end customers.
 * Internal-only fields (e.g. storeId, updatedAt) are omitted.
 *
 * Future: add `imageUrl`, `tags`, and other discovery-relevant fields here.
 */

// ─── Catalog Variant ─────────────────────────────────────────────────────────

export interface CatalogVariant {
  id: string;
  label: string;
  price: number;
  pricingType: PricingType;
  isActive: boolean;
  sortOrder: number;
}

// ─── Catalog Product ─────────────────────────────────────────────────────────

export interface CatalogProduct {
  id: string;
  name: string;
  description: string | null;
  /**
   * Fixed price for simple products (null = variant-priced).
   * When null, pricing is determined by the selected variant.
   */
  price: number | null;
  minQuantity: number;
  variants: CatalogVariant[];
}

// ─── Store Catalog ────────────────────────────────────────────────────────────

/**
 * The complete public catalog for a store.
 * Returned by GetStoreCatalogUseCase and used by the catalog page.
 */
export interface StoreCatalog {
  storeId: string;
  name: string;
  /** URL slug — matches the :storeSlug route param */
  slug: string;
  products: CatalogProduct[];
}
