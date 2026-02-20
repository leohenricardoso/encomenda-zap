import { findProductsByStore } from "@/infra/repositories/productRepository";
import type { ProductResponse } from "@/domain/product/types";

export async function listProducts(
  storeId: string,
): Promise<ProductResponse[]> {
  return findProductsByStore(storeId);
}
