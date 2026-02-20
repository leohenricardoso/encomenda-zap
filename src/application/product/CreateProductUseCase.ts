import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import type { IProductRepository } from "@/domain/product/IProductRepository";
import type {
  CreateProductInput,
  ProductResponse,
} from "@/domain/product/Product";

const MAX_NAME_LENGTH = 200;
const MAX_DESC_LENGTH = 1000;

/**
 * CreateProductUseCase
 *
 * Validates input business rules and delegates persistence to the repository.
 * storeId is always taken from the authenticated session — never from the client.
 */
export class CreateProductUseCase {
  constructor(private readonly repo: IProductRepository) {}

  async execute(input: CreateProductInput): Promise<ProductResponse> {
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

    return this.repo.create({
      storeId: input.storeId,
      name: input.name.trim(),
      description: input.description?.trim(),
      price: input.price,
      isActive: input.isActive ?? true,
    });
  }
}
