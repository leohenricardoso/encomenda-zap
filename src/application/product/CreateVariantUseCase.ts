import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import type { IProductRepository } from "@/domain/product/IProductRepository";
import type {
  CreateVariantInput,
  ProductVariant,
} from "@/domain/product/Product";

const MAX_LABEL_LENGTH = 100;
const VALID_WEIGHT_UNITS = ["g", "kg"] as const;

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
 * - when pricingType is WEIGHT: weightValue must be > 0 and weightUnit must be "g" or "kg"
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

    if (input.pricingType === "WEIGHT") {
      if (typeof input.weightValue !== "number" || input.weightValue <= 0) {
        throw new AppError(
          "weightValue must be a positive number for WEIGHT pricing.",
          HttpStatus.BAD_REQUEST,
        );
      }
      if (
        !input.weightUnit ||
        !VALID_WEIGHT_UNITS.includes(
          input.weightUnit as (typeof VALID_WEIGHT_UNITS)[number],
        )
      ) {
        throw new AppError(
          'weightUnit must be \"g\" or \"kg\" for WEIGHT pricing.',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    return this.repo.createVariant(productId, storeId, {
      label: input.label.trim(),
      price: input.price,
      pricingType: input.pricingType,
      weightValue:
        input.pricingType === "WEIGHT" ? (input.weightValue ?? null) : null,
      weightUnit:
        input.pricingType === "WEIGHT" ? (input.weightUnit ?? null) : null,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 0,
    });
  }
}
