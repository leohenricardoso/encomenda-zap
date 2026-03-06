import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import type { IProductRepository } from "@/domain/product/IProductRepository";
import type { IProductImageRepository } from "@/domain/productImage/IProductImageRepository";
import type { ProductImage } from "@/domain/productImage/ProductImage";
import { uploadProductImage } from "@/infra/storage/uploadProductImage";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_IMAGES = 3;
const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// ─── Input type ───────────────────────────────────────────────────────────────

export interface UploadFileInput {
  buffer: Buffer;
  mimeType: string;
  size: number;
}

// ─── Use case ─────────────────────────────────────────────────────────────────

/**
 * UploadProductImageUseCase
 *
 * Handles multipart file upload to S3 and persists the resulting public URL.
 *
 * Business rules:
 *  - Only image/jpeg, image/png, image/webp are accepted.
 *  - File size must not exceed 3 MB.
 *  - Product must exist and belong to the requesting store (ownership check).
 *  - A product can have at most 3 images.
 *  - Position is automatically assigned as the next free slot (1 → 2 → 3).
 *  - S3 key pattern: products/{storeId}/{productId}/{position}.jpg
 */
export class UploadProductImageUseCase {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly imageRepo: IProductImageRepository,
  ) {}

  async execute(
    productId: string,
    storeId: string,
    file: UploadFileInput,
  ): Promise<ProductImage> {
    // ── Validate mime type ────────────────────────────────────────────────────
    if (!ALLOWED_MIME_TYPES.has(file.mimeType)) {
      throw new AppError(
        `Unsupported file type "${file.mimeType}". Allowed: jpeg, png, webp.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // ── Validate file size ────────────────────────────────────────────────────
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new AppError(
        `File exceeds the maximum allowed size of 3 MB.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // ── Verify product ownership ──────────────────────────────────────────────
    const product = await this.productRepo.findById(productId, storeId);
    if (!product) {
      throw new AppError("Product not found.", HttpStatus.NOT_FOUND);
    }

    // ── Enforce maximum images ────────────────────────────────────────────────
    const existingImages = await this.imageRepo.findByProduct(
      productId,
      storeId,
    );
    if (existingImages.length >= MAX_IMAGES) {
      throw new AppError(
        `Maximum images reached. A product can have at most ${MAX_IMAGES} images.`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // ── Determine next available position ─────────────────────────────────────
    const usedPositions = new Set(existingImages.map((img) => img.position));
    let position = 1;
    while (usedPositions.has(position)) {
      position++;
    }

    // ── Upload to S3 ──────────────────────────────────────────────────────────
    const { imageUrl } = await uploadProductImage({
      buffer: file.buffer,
      storeId,
      productId,
      position,
      mimeType: file.mimeType,
    });

    // ── Persist in database ───────────────────────────────────────────────────
    return this.imageRepo.create({
      productId,
      storeId,
      imageUrl,
      position,
    });
  }
}
