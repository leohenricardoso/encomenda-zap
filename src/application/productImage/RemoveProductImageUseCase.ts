import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import { deleteProductImage } from "@/infra/storage/deleteProductImage";
import type { IProductImageRepository } from "@/domain/productImage/IProductImageRepository";
import type { ProductImage } from "@/domain/productImage/ProductImage";

/**
 * RemoveProductImageUseCase
 *
 * Full deletion pipeline:
 *  1. Fetch the image record (404 if not found / wrong store).
 *  2. Delete the object from S3 — if this fails, the DB record is preserved
 *     so the user can retry without leaving a dangling DB row.
 *  3. Delete the DB record.
 *  4. Compact positions of remaining images so they are always contiguous (1, 2…).
 *
 * Returns the remaining images after repack so callers can update their UI.
 */
export class RemoveProductImageUseCase {
  constructor(private readonly imageRepo: IProductImageRepository) {}

  async execute(imageId: string, storeId: string): Promise<ProductImage[]> {
    // 1 — Fetch (validates ownership via storeId)
    const image = await this.imageRepo.findById(imageId, storeId);
    if (!image) {
      throw new AppError("Image not found.", HttpStatus.NOT_FOUND);
    }

    // 2 — Delete from S3 first; abort if this fails so the DB stay in sync
    try {
      await deleteProductImage(image.imageUrl);
    } catch (s3Err) {
      console.error(
        `[RemoveProductImageUseCase] S3 delete failed for key derived from "${image.imageUrl}":`,
        s3Err,
      );
      throw new AppError(
        "Failed to remove image from storage. Please try again.",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // 3 — Delete DB record
    await this.imageRepo.delete(imageId, storeId);

    // 4 — Compact remaining positions so they are always contiguous
    await this.imageRepo.repackPositions(image.productId, storeId);

    // Return the updated list so the caller can refresh the UI
    return this.imageRepo.findByProduct(image.productId, storeId);
  }
}
