import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import type { IProductCategoryRepository } from "@/domain/category/IProductCategoryRepository";

/**
 * ReorderCategoryProductsUseCase
 *
 * Sets the display order of products within a category.
 * Requires that orderedProductIds contains exactly the IDs currently assigned
 * to the category (no additions or removals).
 */
export class ReorderCategoryProductsUseCase {
  constructor(
    private readonly productCategoryRepo: IProductCategoryRepository,
  ) {}

  async execute(
    categoryId: string,
    storeId: string,
    orderedProductIds: string[],
  ): Promise<void> {
    if (!Array.isArray(orderedProductIds) || orderedProductIds.length === 0) {
      throw new AppError(
        "orderedProductIds must be a non-empty array.",
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.productCategoryRepo.reorderProducts(
      categoryId,
      storeId,
      orderedProductIds,
    );
  }
}
