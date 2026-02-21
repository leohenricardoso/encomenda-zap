import type {
  Product,
  ProductVariant,
  CreateProductInput,
  UpdateProductInput,
  CreateVariantInput,
  UpdateVariantInput,
} from "./Product";

/**
 * Repository interface for Product + ProductVariant persistence.
 *
 * Defined in the domain — infrastructure (Prisma) must satisfy this contract.
 *
 * Multi-tenancy: every method that touches a Product or Variant requires
 * storeId so no cross-tenant data access is possible.
 *
 * All Product reads include their variants (eager loading) to avoid N+1
 * and to keep the domain entity self-contained.
 */
export interface IProductRepository {
  // ─── Product ────────────────────────────────────────────────────────────────

  /** Returns all products for a store, each with their variants. */
  findAllByStore(storeId: string): Promise<Product[]>;

  /**
   * Returns null when the product does not exist OR belongs to a different store.
   * Result always includes variants.
   */
  findById(id: string, storeId: string): Promise<Product | null>;

  /**
   * Creates a product and its initial variants (if any) in one transaction.
   */
  create(input: CreateProductInput): Promise<Product>;

  /**
   * Partially updates product fields. Returns null on not-found / storeId mismatch.
   * Does NOT update variants — use the variant methods below.
   */
  update(
    id: string,
    storeId: string,
    input: UpdateProductInput,
  ): Promise<Product | null>;

  /** Returns false when no row was found. */
  delete(id: string, storeId: string): Promise<boolean>;

  /**
   * Replaces ALL variants for a product in a single transaction.
   * Deletes every existing variant then creates the new list.
   * Returns null if the product is not found / store mismatch.
   */
  replaceVariants(
    productId: string,
    storeId: string,
    variants: CreateVariantInput[],
  ): Promise<Product | null>;

  // ─── Variants ───────────────────────────────────────────────────────────────

  /**
   * Adds a variant to an existing product.
   * storeId is derived from the product — provided here for quick multi-tenant
   * validation without an extra product lookup.
   */
  createVariant(
    productId: string,
    storeId: string,
    input: CreateVariantInput,
  ): Promise<ProductVariant>;

  /**
   * Partially updates a variant. Returns null on not-found or storeId mismatch.
   */
  updateVariant(
    variantId: string,
    storeId: string,
    input: UpdateVariantInput,
  ): Promise<ProductVariant | null>;

  /**
   * Deletes a variant. Returns false when not found or storeId mismatch.
   */
  deleteVariant(variantId: string, storeId: string): Promise<boolean>;
}
