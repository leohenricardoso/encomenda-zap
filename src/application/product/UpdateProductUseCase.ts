import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import type { IProductRepository } from "@/domain/product/IProductRepository";
import type {
  UpdateProductInput,
  ProductResponse,
} from "@/domain/product/Product";

const MAX_NAME_LENGTH = 200;
const MAX_DESC_LENGTH = 1000;

/**
 * UpdateProductUseCase
 *
 * Validates partial update input and delegates to the repository.
 * When input.variants is defined, all existing variants are replaced
 * atomically (delete-then-create transaction in the repository).
 *
 * price may be set to null explicitly (switching a product from simple-price
 * mode to variant-priced mode after variants have been added).
 */
export class UpdateProductUseCase {
  constructor(private readonly repo: IProductRepository) {}

  async execute(
    id: string,
    storeId: string,
    input: UpdateProductInput,
  ): Promise<ProductResponse> {
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

    // price === null is valid (switches to variant-pricing mode)
    if (
      input.price !== undefined &&
      input.price !== null &&
      (typeof input.price !== "number" || input.price <= 0)
    ) {
      throw new AppError(
        "Price must be a positive number.",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      input.minQuantity !== undefined &&
      (!Number.isInteger(input.minQuantity) || input.minQuantity < 1)
    ) {
      throw new AppError(
        "Minimum quantity must be an integer >= 1.",
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate variants when provided
    if (input.variants !== undefined) {
      for (const v of input.variants) {
        if (!v.label || !v.label.trim()) {
          throw new AppError(
            "Variant label cannot be empty.",
            HttpStatus.BAD_REQUEST,
          );
        }
        if (typeof v.price !== "number" || v.price <= 0) {
          throw new AppError(
            "Variant price must be a positive number.",
            HttpStatus.BAD_REQUEST,
          );
        }
      }
    }

    const updated = await this.repo.update(id, storeId, input);
    if (!updated) {
      throw new AppError("Product not found.", HttpStatus.NOT_FOUND);
    }

    // Replace all variants atomically when variants were provided
    if (input.variants !== undefined) {
      const withVariants = await this.repo.replaceVariants(
        id,
        storeId,
        input.variants,
      );
      if (!withVariants) {
        throw new AppError("Product not found.", HttpStatus.NOT_FOUND);
      }
      return withVariants;
    }

    return updated;
  }
}
