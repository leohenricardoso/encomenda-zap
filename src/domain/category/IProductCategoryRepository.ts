import type { Category } from "./Category";

/**
 * IProductCategoryRepository — domain interface for the product↔category join.
 *
 * Keeps category-assignment logic out of the product and category repositories.
 */
export interface IProductCategoryRepository {
  /**
   * Assign a product to a category.
   * position = next available slot within the category.
   */
  assign(productId: string, categoryId: string, storeId: string): Promise<void>;

  /** Remove a product from a category. No-op if not assigned. */
  remove(productId: string, categoryId: string, storeId: string): Promise<void>;

  /**
   * Replace ALL category assignments for a product in one transaction.
   * Used when saving a product form with a new category selection.
   */
  replaceForProduct(
    productId: string,
    storeId: string,
    categoryIds: string[],
  ): Promise<void>;

  /**
   * Return all category IDs assigned to a product (ordered by category position).
   */
  findCategoryIdsByProduct(
    productId: string,
    storeId: string,
  ): Promise<string[]>;

  /**
   * Return lightweight category objects assigned to a product.
   * Used to fill "categories" chips in product detail / order view.
   */
  findCategoriesByProduct(
    productId: string,
    storeId: string,
  ): Promise<Pick<Category, "id" | "name" | "slug">[]>;

  /**
   * Bulk-reorder products within a category.
   * orderedProductIds must contain exactly the IDs currently assigned.
   */
  reorderProducts(
    categoryId: string,
    storeId: string,
    orderedProductIds: string[],
  ): Promise<void>;

  /**
   * Return the next available position for a new product inside a category.
   */
  nextPositionInCategory(categoryId: string, storeId: string): Promise<number>;

  /**
   * Return all products assigned to a category, ordered by position.
   */
  findProductsByCategory(
    categoryId: string,
    storeId: string,
  ): Promise<
    Array<{
      productId: string;
      productName: string;
      position: number;
      isActive: boolean;
    }>
  >;
}
