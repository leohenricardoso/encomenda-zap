import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import type { IProductRepository } from "@/domain/product/IProductRepository";
import type { ProductResponse } from "@/domain/product/Product";

/**
 * GetProductByIdUseCase
 *
 * Fetches a single product, enforcing storeId ownership.
 * Throws NOT_FOUND for both "product missing" and "wrong store" to prevent
 * information leakage about other stores' IDs.
 */
export class GetProductByIdUseCase {
  constructor(private readonly repo: IProductRepository) {}

  async execute(id: string, storeId: string): Promise<ProductResponse> {
    const product = await this.repo.findById(id, storeId);
    if (!product) {
      throw new AppError("Product not found.", HttpStatus.NOT_FOUND);
    }
    return product;
  }
}
