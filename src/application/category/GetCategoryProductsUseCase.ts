import type { IProductCategoryRepository } from "@/domain/category/IProductCategoryRepository";

export class GetCategoryProductsUseCase {
  constructor(
    private readonly productCategoryRepo: IProductCategoryRepository,
  ) {}

  async execute(
    categoryId: string,
    storeId: string,
  ): Promise<
    Array<{
      productId: string;
      productName: string;
      position: number;
      isActive: boolean;
    }>
  > {
    return this.productCategoryRepo.findProductsByCategory(categoryId, storeId);
  }
}
