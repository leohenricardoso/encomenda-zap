import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import { updateProduct as updateProductRepo } from "@/infra/repositories/productRepository";
import type {
  UpdateProductInput,
  ProductResponse,
} from "@/domain/product/types";

const MAX_NAME_LENGTH = 200;
const MAX_DESC_LENGTH = 1000;

export async function updateProduct(
  id: string,
  storeId: string,
  input: UpdateProductInput,
): Promise<ProductResponse> {
  if (Object.keys(input).length === 0) {
    throw new AppError(
      "No fields provided for update.",
      HttpStatus.BAD_REQUEST,
    );
  }
  if (input.name !== undefined) {
    if (!input.name.trim()) {
      throw new AppError(
        "Product name cannot be empty.",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (input.name.length > MAX_NAME_LENGTH) {
      throw new AppError(
        `Name must be at most ${MAX_NAME_LENGTH} characters.`,
        HttpStatus.BAD_REQUEST,
      );
    }
    input.name = input.name.trim();
  }
  if (
    input.description !== undefined &&
    input.description.length > MAX_DESC_LENGTH
  ) {
    throw new AppError(
      `Description must be at most ${MAX_DESC_LENGTH} characters.`,
      HttpStatus.BAD_REQUEST,
    );
  }
  if (
    input.price !== undefined &&
    (typeof input.price !== "number" || input.price < 0)
  ) {
    throw new AppError(
      "Price must be a non-negative number.",
      HttpStatus.BAD_REQUEST,
    );
  }

  const updated = await updateProductRepo(id, storeId, input);
  if (!updated) {
    throw new AppError("Product not found.", HttpStatus.NOT_FOUND);
  }
  return updated;
}
