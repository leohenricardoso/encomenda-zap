import type {
  Category,
  CategorySummary,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "./Category";

/**
 * ICategoryRepository — domain interface for Category persistence.
 *
 * Defined in the domain layer — infrastructure implementations must comply.
 * Every method is scoped to a storeId to guarantee multi-tenant isolation.
 */
export interface ICategoryRepository {
  /** Persist a new category and return it. */
  create(
    input: CreateCategoryInput & { slug: string; position: number },
  ): Promise<Category>;

  /** Fetch a single category by id, scoped to the store. Null if not found. */
  findById(id: string, storeId: string): Promise<Category | null>;

  /** Fetch by slug within a store. Null if not found. */
  findBySlug(slug: string, storeId: string): Promise<Category | null>;

  /** All categories for a store, ordered by position ASC. */
  findAllByStore(storeId: string): Promise<CategorySummary[]>;

  /** Update mutable fields (name, slug, isActive). Returns null if not found. */
  update(
    id: string,
    storeId: string,
    input: UpdateCategoryInput,
  ): Promise<Category | null>;

  /** Hard-delete a category. Throws if products are still assigned. */
  delete(id: string, storeId: string): Promise<void>;

  /** Returns the number of products currently assigned to this category. */
  countProducts(categoryId: string, storeId: string): Promise<number>;

  /** Returns the current maximum position value for a store's categories. */
  maxPosition(storeId: string): Promise<number>;

  /**
   * Batch-update the position of multiple categories in one transaction.
   * Only categories belonging to `storeId` are affected (tenant-safe).
   */
  reorderCategories(
    storeId: string,
    items: { id: string; position: number }[],
  ): Promise<void>;
}
