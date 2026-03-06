import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import type { IProductRepository } from "@/domain/product/IProductRepository";
import type { IProductImageRepository } from "@/domain/productImage/IProductImageRepository";
import type { ProductImage } from "@/domain/productImage/ProductImage";

const MAX_IMAGES = 3;
const MAX_URL_LENGTH = 2048;

/**
 * AddProductImageUseCase
 *
 * Adds an image to a product by persisting its public URL.
 *
 * Business rules:
 * - Product must exist and belong to the requesting store.
 * - A product can have at most 3 images.
 * - The URL must be a non-empty string (max 2048 chars).
 * - The next available position (1 → 2 → 3) is assigned automatically.
 *
 * S3 upload is handled client-side; this use case only receives the
 * resulting public URL.
 */
export class AddProductImageUseCase {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly imageRepo: IProductImageRepository,
  ) {}

  async execute(
    productId: string,
    storeId: string,
    imageUrl: string,
  ): Promise<ProductImage> {
    // ── Validate URL ───────────────────────────────────────────────────────
    const trimmedUrl = imageUrl?.trim() ?? "";
    if (!trimmedUrl) {
      throw new AppError("imageUrl is required.", HttpStatus.BAD_REQUEST);
    }
    if (trimmedUrl.length > MAX_URL_LENGTH) {
      throw new AppError(
        `imageUrl must be at most ${MAX_URL_LENGTH} characters.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // ── Verify product ownership ───────────────────────────────────────────
    const product = await this.productRepo.findById(productId, storeId);
    if (!product) {
      throw new AppError("Product not found.", HttpStatus.NOT_FOUND);
    }

    // ── Enforce max images ─────────────────────────────────────────────────
    const existingImages = await this.imageRepo.findByProduct(
      productId,
      storeId,
    );
    if (existingImages.length >= MAX_IMAGES) {
      throw new AppError(
        `A product can have at most ${MAX_IMAGES} images.`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // ── Assign next available position ─────────────────────────────────────
    const usedPositions = new Set(existingImages.map((img) => img.position));
    let position = 1;
    while (usedPositions.has(position)) {
      position++;
    }

    return this.imageRepo.create({
      productId,
      storeId,
      imageUrl: trimmedUrl,
      position,
    });
  }
}
