import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import type { IProductImageRepository } from "@/domain/productImage/IProductImageRepository";
import type { ProductImage } from "@/domain/productImage/ProductImage";

/**
 * GetProductImagesUseCase
 *
 * Returns all images for a product ordered by position (ascending).
 * Scoped to the requesting store to prevent cross-tenant reads.
 */
export class GetProductImagesUseCase {
  constructor(private readonly imageRepo: IProductImageRepository) {}

  async execute(productId: string, storeId: string): Promise<ProductImage[]> {
    if (!productId?.trim()) {
      throw new AppError("productId is required.", HttpStatus.BAD_REQUEST);
    }
    return this.imageRepo.findByProduct(productId, storeId);
  }
}
