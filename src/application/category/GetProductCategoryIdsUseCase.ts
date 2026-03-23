import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import type { IProductCategoryRepository } from "@/domain/category/IProductCategoryRepository";

/**
 * Returns the IDs of all categories assigned to a given product.
 * Scoped to the requesting store to prevent cross-tenant reads.
 */
export class GetProductCategoryIdsUseCase {
  constructor(
    private readonly productCategoryRepo: IProductCategoryRepository,
  ) {}

  async execute(productId: string, storeId: string): Promise<string[]> {
    if (!productId?.trim()) {
      throw new AppError("productId is required.", HttpStatus.BAD_REQUEST);
    }
    return this.productCategoryRepo.findCategoryIdsByProduct(
      productId,
      storeId,
    );
  }
}
