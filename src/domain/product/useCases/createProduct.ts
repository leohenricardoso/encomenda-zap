import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import { createProduct as createProductRepo } from "@/infra/repositories/productRepository";
import type {
  CreateProductInput,
  ProductResponse,
} from "@/domain/product/types";

const MAX_NAME_LENGTH = 200;
const MAX_DESC_LENGTH = 1000;

export async function createProduct(
  input: CreateProductInput,
): Promise<ProductResponse> {
  if (!input.name?.trim()) {
    throw new AppError("Product name is required.", HttpStatus.BAD_REQUEST);
  }
  if (input.name.length > MAX_NAME_LENGTH) {
    throw new AppError(
      `Name must be at most ${MAX_NAME_LENGTH} characters.`,
      HttpStatus.BAD_REQUEST,
    );
  }
  if (input.description && input.description.length > MAX_DESC_LENGTH) {
    throw new AppError(
      `Description must be at most ${MAX_DESC_LENGTH} characters.`,
      HttpStatus.BAD_REQUEST,
    );
  }
  if (typeof input.price !== "number" || input.price < 0) {
    throw new AppError(
      "Price must be a non-negative number.",
      HttpStatus.BAD_REQUEST,
    );
  }

  return createProductRepo({
    storeId: input.storeId,
    name: input.name.trim(),
    description: input.description?.trim(),
    price: input.price,
    isActive: input.isActive ?? true,
  });
}
