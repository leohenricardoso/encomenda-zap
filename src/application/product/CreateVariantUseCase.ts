import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import type { IProductRepository } from "@/domain/product/IProductRepository";
import type {
  CreateVariantInput,
  ProductVariant,
} from "@/domain/product/Product";

const MAX_LABEL_LENGTH = 100;

/**
 * CreateVariantUseCase
 *
 * Adds a variant to an existing product.
 * The product must belong to the authenticated store (storeId enforces this).
 *
 * Business rules:
 * - label must be non-empty and ≤ MAX_LABEL_LENGTH
 * - price must be > 0
 * - pricingType must be a known value
 */
export class CreateVariantUseCase {
  constructor(private readonly repo: IProductRepository) {}

  async execute(
    productId: string,
    storeId: string,
    input: CreateVariantInput,
  ): Promise<ProductVariant> {
    if (!input.label?.trim()) {
      throw new AppError("Variant label is required.", HttpStatus.BAD_REQUEST);
    }
    if (input.label.length > MAX_LABEL_LENGTH) {
      throw new AppError(
        `Variant label must be at most ${MAX_LABEL_LENGTH} characters.`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (typeof input.price !== "number" || input.price <= 0) {
      throw new AppError(
        "Variant price must be a positive number.",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!["UNIT", "WEIGHT"].includes(input.pricingType)) {
      throw new AppError(
        "Invalid pricingType. Must be UNIT or WEIGHT.",
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.repo.createVariant(productId, storeId, {
      label: input.label.trim(),
      price: input.price,
      pricingType: input.pricingType,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 0,
    });
  }
}
