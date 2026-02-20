import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import { deleteProduct as deleteProductRepo } from "@/infra/repositories/productRepository";

export async function deleteProduct(
  id: string,
  storeId: string,
): Promise<void> {
  const deleted = await deleteProductRepo(id, storeId);
  if (!deleted) {
    throw new AppError("Product not found.", HttpStatus.NOT_FOUND);
  }
}
