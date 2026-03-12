import type { StoreCatalog } from "./types";

/**
 * ICatalogRepository — read-only view of a store's public catalog.
 *
 * Only active products (and their active variants) are surfaced.
 * Defined in the domain: infrastructure must satisfy this contract.
 */
export interface ICatalogRepository {
  /**
   * Looks up a store by its URL slug and returns its public catalog.
   * When categorySlug is provided, only products in that category are returned.
   *
   * Returns null when:
   *  - No store exists with the given slug
   *  - The store is inactive (isActive = false)
   *
   * Products are returned ordered by name ascending; variants by sortOrder.
   * Only active products and active variants are included.
   */
  findBySlug(slug: string, categorySlug?: string): Promise<StoreCatalog | null>;
}
