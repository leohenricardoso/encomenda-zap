import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import type { IProductRepository } from "@/domain/product/IProductRepository";

/**
 * DeleteVariantUseCase
 *
 * Removes a variant from a product.
 * storeId enforcement lives in the repository WHERE clause.
 */
export class DeleteVariantUseCase {
  constructor(private readonly repo: IProductRepository) {}

  async execute(variantId: string, storeId: string): Promise<void> {
    const deleted = await this.repo.deleteVariant(variantId, storeId);
    if (!deleted) {
      throw new AppError("Variant not found.", HttpStatus.NOT_FOUND);
    }
  }
}
