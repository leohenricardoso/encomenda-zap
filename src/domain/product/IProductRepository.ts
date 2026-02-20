import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
} from "./Product";

/**
 * Repository interface for Product persistence.
 *
 * Defined in the domain — infrastructure implementations (e.g. Prisma) must
 * satisfy this contract via class implementation.
 *
 * All read/write operations are scoped by storeId (multi-tenancy).
 * No method ever allows cross-store access.
 */
export interface IProductRepository {
  findAllByStore(storeId: string): Promise<Product[]>;

  /**
   * Returns null when the product does not exist OR belongs to a different store.
   * Callers should treat both cases identically (product not found).
   */
  findById(id: string, storeId: string): Promise<Product | null>;

  create(input: CreateProductInput): Promise<Product>;

  /**
   * Returns null when the product does not exist or storeId mismatch.
   */
  update(
    id: string,
    storeId: string,
    input: UpdateProductInput,
  ): Promise<Product | null>;

  /**
   * Returns false when no row was found (not found or wrong store).
   */
  delete(id: string, storeId: string): Promise<boolean>;
}
