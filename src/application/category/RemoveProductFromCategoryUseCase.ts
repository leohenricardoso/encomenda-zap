import type { IProductCategoryRepository } from "@/domain/category/IProductCategoryRepository";

/**
 * RemoveProductFromCategoryUseCase
 *
 * Removes a product from a category.
 * No-op if the assignment does not exist.
 */
export class RemoveProductFromCategoryUseCase {
  constructor(
    private readonly productCategoryRepo: IProductCategoryRepository,
  ) {}

  async execute(
    productId: string,
    categoryId: string,
    storeId: string,
  ): Promise<void> {
    await this.productCategoryRepo.remove(productId, categoryId, storeId);
  }
}
