import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import { prisma } from "@/infra/prisma";
import type { IProductImageRepository } from "@/domain/productImage/IProductImageRepository";
import type { ProductImage } from "@/domain/productImage/ProductImage";

/**
 * SetImageAsPrimaryUseCase
 *
 * Promotes an image to position = 1 (main catalog image).
 * Swaps positions with whatever image is currently at position 1.
 *
 * Algorithm (all steps inside a single DB transaction to maintain the
 * @@unique([productId, position]) constraint safely):
 *   1. Move the current primary to a temporary position (999) — frees slot 1.
 *   2. Move the target image to position 1.
 *   3. Move the temporarily-placed image to the target's original position.
 *
 * If the target is already the primary, the method is a no-op.
 * The store guard prevents cross-tenant mutations.
 */
export class SetImageAsPrimaryUseCase {
  constructor(private readonly imageRepo: IProductImageRepository) {}

  async execute(imageId: string, storeId: string): Promise<ProductImage[]> {
    // ── Find target image ──────────────────────────────────────────────────
    const target = await this.imageRepo.findById(imageId, storeId);
    if (!target) {
      throw new AppError("Image not found.", HttpStatus.NOT_FOUND);
    }

    // ── No-op if already primary ───────────────────────────────────────────
    if (target.position === 1) {
      return this.imageRepo.findByProduct(target.productId, storeId);
    }

    // ── Find current primary ──────────────────────────────────────────────
    const allImages = await this.imageRepo.findByProduct(
      target.productId,
      storeId,
    );
    const currentPrimary = allImages.find((img) => img.position === 1);

    const TEMP_POSITION = 999;

    await prisma.$transaction(async (tx) => {
      if (currentPrimary) {
        // Step 1: move existing primary out of the way to a temp slot
        await tx.productImage.update({
          where: { id: currentPrimary.id },
          data: { position: TEMP_POSITION },
        });
      }

      // Step 2: promote the target to position 1
      await tx.productImage.update({
        where: { id: target.id },
        data: { position: 1 },
      });

      if (currentPrimary) {
        // Step 3: place the former primary at the target's original position
        await tx.productImage.update({
          where: { id: currentPrimary.id },
          data: { position: target.position },
        });
      }
    });

    return this.imageRepo.findByProduct(target.productId, storeId);
  }
}
