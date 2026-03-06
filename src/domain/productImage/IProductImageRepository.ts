import type { ProductImage, CreateProductImageInput } from "./ProductImage";

/**
 * Repository interface for ProductImage persistence.
 *
 * Defined in the domain — infrastructure (Prisma) must satisfy this contract.
 *
 * Multi-tenancy: methods that write or read images accept storeId to prevent
 * cross-tenant data access.
 */
export interface IProductImageRepository {
  /**
   * Persists a new product image at the given position.
   * Callers must ensure position 1-3 is available before calling.
   */
  create(input: CreateProductImageInput): Promise<ProductImage>;

  /**
   * Returns all images for a product ordered ascending by position.
   * Results are scoped to the owning store.
   */
  findByProduct(productId: string, storeId: string): Promise<ProductImage[]>;

  /**
   * Returns a single image by id.
   * Returns null if not found or if it belongs to a different store.
   */
  findById(id: string, storeId: string): Promise<ProductImage | null>;

  /**
   * Deletes an image. Returns false when the row was not found.
   * storeId guard prevents cross-tenant deletions.
   */
  delete(id: string, storeId: string): Promise<boolean>;

  /**
   * Updates the position of a single image.
   * Returns null when not found or store mismatch.
   */
  updatePosition(
    id: string,
    storeId: string,
    position: number,
  ): Promise<ProductImage | null>;

  /**
   * Returns the total number of images for a product (0–3).
   */
  countByProduct(productId: string): Promise<number>;
}
