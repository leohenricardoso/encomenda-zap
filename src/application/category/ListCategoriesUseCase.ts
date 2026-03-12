import type { ICategoryRepository } from "@/domain/category/ICategoryRepository";
import type { CategorySummary } from "@/domain/category/Category";

/**
 * ListCategoriesUseCase
 *
 * Returns all categories for a store ordered by position ASC.
 * Includes a productCount for each category for the admin table.
 */
export class ListCategoriesUseCase {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(storeId: string): Promise<CategorySummary[]> {
    return this.categoryRepo.findAllByStore(storeId);
  }
}
