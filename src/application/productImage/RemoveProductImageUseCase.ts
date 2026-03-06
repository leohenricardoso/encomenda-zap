import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import type { IProductImageRepository } from "@/domain/productImage/IProductImageRepository";

/**
 * RemoveProductImageUseCase
 *
 * Deletes a product image by id.
 * Deletion naturally frees its position; remaining images keep their positions.
 *
 * The store guard ensures a store owner can only delete images that belong
 * to their own products.
 */
export class RemoveProductImageUseCase {
  constructor(private readonly imageRepo: IProductImageRepository) {}

  async execute(imageId: string, storeId: string): Promise<void> {
    const deleted = await this.imageRepo.delete(imageId, storeId);
    if (!deleted) {
      throw new AppError("Image not found.", HttpStatus.NOT_FOUND);
    }
  }
}
