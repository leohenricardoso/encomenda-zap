import type { IProductRepository } from "@/domain/product/IProductRepository";
import type { ProductResponse } from "@/domain/product/Product";

/**
 * ListProductsUseCase
 *
 * Returns all products belonging to the given store, ordered by creation date.
 * storeId is always taken from the authenticated session — multi-tenancy enforced.
 */
export class ListProductsUseCase {
  constructor(private readonly repo: IProductRepository) {}

  async execute(storeId: string): Promise<ProductResponse[]> {
    return this.repo.findAllByStore(storeId);
  }
}
