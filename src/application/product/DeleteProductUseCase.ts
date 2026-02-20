import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import type { IProductRepository } from "@/domain/product/IProductRepository";

/**
 * DeleteProductUseCase
 *
 * Deletes a product; the repository enforces storeId guard.
 * Throws NOT_FOUND when no row was deleted (product missing or wrong store).
 */
export class DeleteProductUseCase {
  constructor(private readonly repo: IProductRepository) {}

  async execute(id: string, storeId: string): Promise<void> {
    const deleted = await this.repo.delete(id, storeId);
    if (!deleted) {
      throw new AppError("Product not found.", HttpStatus.NOT_FOUND);
    }
  }
}
