import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import { findProductById } from "@/infra/repositories/productRepository";
import type { ProductResponse } from "@/domain/product/types";

export async function getProductById(
  id: string,
  storeId: string,
): Promise<ProductResponse> {
  const product = await findProductById(id, storeId);
  if (!product) {
    throw new AppError("Product not found.", HttpStatus.NOT_FOUND);
  }
  return product;
}
