import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import type { IProductRepository } from "@/domain/product/IProductRepository";
import type {
  UpdateVariantInput,
  ProductVariant,
} from "@/domain/product/Product";

const MAX_LABEL_LENGTH = 100;
const VALID_WEIGHT_UNITS = ["g", "kg"] as const;

/**
 * UpdateVariantUseCase
 *
 * Partially updates a variant. storeId is checked in the repository's WHERE
 * clause — a variant belonging to another store returns null → 404.
 */
export class UpdateVariantUseCase {
  constructor(private readonly repo: IProductRepository) {}

  async execute(
    variantId: string,
    storeId: string,
    input: UpdateVariantInput,
  ): Promise<ProductVariant> {
    if (input.label !== undefined) {
      if (!input.label.trim()) {
        throw new AppError(
          "Variant label cannot be empty.",
          HttpStatus.BAD_REQUEST,
        );
      }
      if (input.label.length > MAX_LABEL_LENGTH) {
        throw new AppError(
          `Variant label must be at most ${MAX_LABEL_LENGTH} characters.`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    if (
      input.price !== undefined &&
      (typeof input.price !== "number" || input.price <= 0)
    ) {
      throw new AppError(
        "Variant price must be a positive number.",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      input.pricingType !== undefined &&
      !["UNIT", "WEIGHT"].includes(input.pricingType)
    ) {
      throw new AppError(
        "Invalid pricingType. Must be UNIT or WEIGHT.",
        HttpStatus.BAD_REQUEST,
      );
    }

    // When switching to WEIGHT pricing, weight fields become required.
    const effectivePricingType = input.pricingType;
    if (effectivePricingType === "WEIGHT") {
      if (input.weightValue !== undefined && input.weightValue !== null) {
        if (typeof input.weightValue !== "number" || input.weightValue <= 0) {
          throw new AppError(
            "weightValue must be a positive number for WEIGHT pricing.",
            HttpStatus.BAD_REQUEST,
          );
        }
      }
      if (
        input.weightUnit !== undefined &&
        input.weightUnit !== null &&
        !VALID_WEIGHT_UNITS.includes(
          input.weightUnit as (typeof VALID_WEIGHT_UNITS)[number],
        )
      ) {
        throw new AppError(
          'weightUnit must be \"g\" or \"kg\".',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const updated = await this.repo.updateVariant(variantId, storeId, input);
    if (!updated) {
      throw new AppError("Variant not found.", HttpStatus.NOT_FOUND);
    }
    return updated;
  }
}
