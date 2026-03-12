import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import type { ICategoryRepository } from "@/domain/category/ICategoryRepository";
import type { IProductCategoryRepository } from "@/domain/category/IProductCategoryRepository";
import type { IProductRepository } from "@/domain/product/IProductRepository";

/**
 * AssignProductToCategoryUseCase
 *
 * Assigns a product to a category.
 * Validates that both the product and category belong to the same store.
 * Silently succeeds if the assignment already exists (idempotent).
 */
export class AssignProductToCategoryUseCase {
  constructor(
    private readonly categoryRepo: ICategoryRepository,
    private readonly productCategoryRepo: IProductCategoryRepository,
    private readonly productRepo: IProductRepository,
  ) {}

  async execute(
    productId: string,
    categoryId: string,
    storeId: string,
  ): Promise<void> {
    const [category, product] = await Promise.all([
      this.categoryRepo.findById(categoryId, storeId),
      this.productRepo.findById(productId, storeId),
    ]);

    if (!category) {
      throw new AppError("Category not found.", HttpStatus.NOT_FOUND);
    }
    if (!product) {
      throw new AppError("Product not found.", HttpStatus.NOT_FOUND);
    }

    await this.productCategoryRepo.assign(productId, categoryId, storeId);
  }
}
