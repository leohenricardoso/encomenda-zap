import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import type { IProductRepository } from "@/domain/product/IProductRepository";
import type {
  CreateProductInput,
  ProductResponse,
} from "@/domain/product/Product";

const MAX_NAME_LENGTH = 200;
const MAX_DESC_LENGTH = 1000;
const MAX_VARIANT_LABEL_LENGTH = 100;
const MAX_VARIANTS = 50;

/**
 * CreateProductUseCase
 *
 * Validates all business rules then delegates to the repository.
 * A product may be created:
 *   - Without variants: requires price > 0 at the product level.
 *   - With variants:    price on the product is optional; each variant
 *                       must have price > 0 and a non-empty label.
 *
 * storeId always comes from the authenticated session, never from the client.
 */
export class CreateProductUseCase {
  constructor(private readonly repo: IProductRepository) {}

  async execute(input: CreateProductInput): Promise<ProductResponse> {
    // ── Product-level validations ──────────────────────────────────────────

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

    const hasVariants = (input.variants?.length ?? 0) > 0;

    if (!hasVariants) {
      // Simple product — base price is mandatory
      if (input.price === undefined || input.price === null) {
        throw new AppError(
          "Price is required for products without variants.",
          HttpStatus.BAD_REQUEST,
        );
      }
      if (typeof input.price !== "number" || input.price <= 0) {
        throw new AppError(
          "Price must be a positive number.",
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const minQty = input.minQuantity ?? 1;
    if (!Number.isInteger(minQty) || minQty < 1) {
      throw new AppError(
        "Minimum quantity must be an integer >= 1.",
        HttpStatus.BAD_REQUEST,
      );
    }

    // ── Variant validations ───────────────────────────────────────────────

    if (hasVariants) {
      if (input.variants!.length > MAX_VARIANTS) {
        throw new AppError(
          `A product can have at most ${MAX_VARIANTS} variants.`,
          HttpStatus.BAD_REQUEST,
        );
      }
      for (const v of input.variants!) {
        if (!v.label?.trim()) {
          throw new AppError(
            "Each variant must have a non-empty label.",
            HttpStatus.BAD_REQUEST,
          );
        }
        if (v.label.length > MAX_VARIANT_LABEL_LENGTH) {
          throw new AppError(
            `Variant label must be at most ${MAX_VARIANT_LABEL_LENGTH} characters.`,
            HttpStatus.BAD_REQUEST,
          );
        }
        if (typeof v.price !== "number" || v.price <= 0) {
          throw new AppError(
            `Variant "${v.label}": price must be a positive number.`,
            HttpStatus.BAD_REQUEST,
          );
        }
      }
    }

    return this.repo.create({
      storeId: input.storeId,
      name: input.name.trim(),
      description: input.description?.trim(),
      price: hasVariants ? undefined : input.price,
      minQuantity: minQty,
      isActive: input.isActive ?? true,
      variants: input.variants ?? [],
    });
  }
}
