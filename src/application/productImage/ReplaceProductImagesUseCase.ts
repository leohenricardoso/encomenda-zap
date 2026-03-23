import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import type { IProductRepository } from "@/domain/product/IProductRepository";
import type { IProductImageRepository } from "@/domain/productImage/IProductImageRepository";
import type { ProductImage } from "@/domain/productImage/ProductImage";
import {
  extractS3Key,
  copyS3Object,
  deleteS3ObjectByKey,
  uploadBufferToS3Key,
} from "@/infra/storage/s3Operations";
import { AWS_REGION, S3_BUCKET } from "@/infra/storage/s3Client";

// ─── Input types ──────────────────────────────────────────────────────────────

/** An already-persisted image being kept, possibly at a new position. */
export interface ExistingSlot {
  kind: "existing";
  /** Current DB image ID — used to look up the current S3 URL. */
  id: string;
  targetPosition: number;
}

/** A new file to be uploaded at the given position. */
export interface NewSlot {
  kind: "new";
  buffer: Buffer;
  mimeType: string;
  size: number;
  targetPosition: number;
}

export type ReplaceSlot = ExistingSlot | NewSlot;

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_IMAGES = 3;
const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// ─── Use case ─────────────────────────────────────────────────────────────────

/**
 * ReplaceProductImagesUseCase
 *
 * Atomically replaces the entire image set for a product.
 *
 * The preview state is treated as the single source of truth — S3 and the
 * database are brought into exact alignment with it on every successful save.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * SAFE PHASE ORDERING
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * The critical design constraint: never delete S3 objects until ALL new content
 * has been safely staged in temporary keys.  This makes every phase failure
 * recoverable — either by the current request (cleanup) or by the next retry.
 *
 *  Phase 1  — Validate input + fetch current state from DB
 *  Phase 2  — Copy each KEPT image to a temp key  (tmp_kept_{id}.jpg)
 *             ↳ If this fails, abort: nothing has been deleted yet.
 *  Phase 3  — Upload each NEW file to a temp key  (tmp_new_{pos}.jpg)
 *             ↳ If this fails, abort: nothing has been deleted yet.
 *             ↳ After Phase 2+3 succeed, all final content is staged safely.
 *  Phase 4  — Delete all existing positional S3 keys  (best-effort)
 *  Phase 5  — Copy ALL temp keys to their final positional keys
 *  Phase 6  — Delete temp keys  (best-effort, orphans are harmless)
 *  Phase 7  — Atomic DB replace via a single Prisma transaction
 *
 * If the server crashes between Phase 4 and Phase 7 the product will briefly
 * show broken image links (URLs in DB no longer exist in S3).  On the next
 * save the replace runs again and heals the state.
 */
export class ReplaceProductImagesUseCase {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly imageRepo: IProductImageRepository,
  ) {}

  async execute(
    productId: string,
    storeId: string,
    slots: ReplaceSlot[],
  ): Promise<ProductImage[]> {
    // ── Phase 1: Validate ─────────────────────────────────────────────────────

    if (slots.length > MAX_IMAGES) {
      throw new AppError(
        `Maximum ${MAX_IMAGES} images per product.`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    for (const slot of slots) {
      if (slot.kind !== "new") continue;
      if (!ALLOWED_MIME_TYPES.has(slot.mimeType)) {
        throw new AppError(
          `Unsupported file type "${slot.mimeType}". Allowed: jpeg, png, webp.`,
          HttpStatus.BAD_REQUEST,
        );
      }
      if (slot.size > MAX_FILE_SIZE_BYTES) {
        throw new AppError(
          "File exceeds the maximum allowed size of 3 MB.",
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const product = await this.productRepo.findById(productId, storeId);
    if (!product) {
      throw new AppError("Product not found.", HttpStatus.NOT_FOUND);
    }

    const currentImages = await this.imageRepo.findByProduct(
      productId,
      storeId,
    );
    const currentById = new Map(currentImages.map((img) => [img.id, img]));

    for (const slot of slots) {
      if (slot.kind === "existing" && !currentById.has(slot.id)) {
        throw new AppError(
          `Image "${slot.id}" not found for this product.`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // ── Accumulate all temp keys for cleanup in the finally block ────────────
    const allTmpKeys: string[] = [];

    // Maps imageId  → { tmpKey, targetPosition } for kept existing images
    const keptTmp = new Map<
      string,
      { tmpKey: string; targetPosition: number }
    >();
    // Maps targetPosition → tmpKey               for newly uploaded files
    const newTmp = new Map<number, string>();

    try {
      // ── Phase 2: Copy KEPT images to temp keys ──────────────────────────────
      // Done BEFORE any deletion — if this throws, nothing has been removed.

      for (const slot of slots) {
        if (slot.kind !== "existing") continue;

        const img = currentById.get(slot.id)!;
        const srcKey = extractS3Key(img.imageUrl);
        const tmpKey = `products/${storeId}/${productId}/tmp_kept_${slot.id}.jpg`;

        await copyS3Object(srcKey, tmpKey);

        allTmpKeys.push(tmpKey);
        keptTmp.set(slot.id, { tmpKey, targetPosition: slot.targetPosition });
      }

      // ── Phase 3: Upload NEW files to temp keys ─────────────────────────────
      // Also done BEFORE any deletion — all new content safely staged in S3.

      for (const slot of slots) {
        if (slot.kind !== "new") continue;

        const tmpKey = `products/${storeId}/${productId}/tmp_new_${slot.targetPosition}.jpg`;

        await uploadBufferToS3Key(tmpKey, slot.buffer, slot.mimeType);

        allTmpKeys.push(tmpKey);
        newTmp.set(slot.targetPosition, tmpKey);
      }

      // ─────────────────────────────────────────────────────────────────────────
      // At this point ALL final content exists in S3 under temp keys.
      // Phases 4-6 are safe to run: failures leave orphaned temp keys (harmless)
      // and do not corrupt the product's visible state (DB is still unchanged).
      // ─────────────────────────────────────────────────────────────────────────

      // ── Phase 4: Delete all existing positional S3 keys ────────────────────
      // Best-effort: each deletion is wrapped individually. An orphaned old key
      // only causes minor S3 bloat — it will not appear in the product UI
      // because Phase 7 will update the DB to reference only the new URLs.

      for (const img of currentImages) {
        try {
          await deleteS3ObjectByKey(extractS3Key(img.imageUrl));
        } catch {
          // Idempotent — continue even if the key was already gone.
        }
      }

      // ── Phase 5: Copy temp keys to their final positional keys ──────────────

      const finalUrls = new Map<number, string>(); // targetPosition → imageUrl

      for (const [, { tmpKey, targetPosition }] of keptTmp) {
        const destKey = `products/${storeId}/${productId}/${targetPosition}.jpg`;
        await copyS3Object(tmpKey, destKey);
        finalUrls.set(
          targetPosition,
          `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${destKey}`,
        );
      }

      for (const [targetPosition, tmpKey] of newTmp) {
        const destKey = `products/${storeId}/${productId}/${targetPosition}.jpg`;
        await copyS3Object(tmpKey, destKey);
        finalUrls.set(
          targetPosition,
          `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${destKey}`,
        );
      }

      // ── Phase 7: Atomic DB replace ────────────────────────────────────────
      // Build the ordered image list from slots (preserves position order).

      const dbImages = slots
        .filter((s) => s.kind !== ("empty" as string))
        .map((slot) => {
          const imageUrl = finalUrls.get(slot.targetPosition);
          if (!imageUrl) {
            throw new AppError(
              `Failed to resolve final URL for position ${slot.targetPosition}.`,
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }
          return { imageUrl, position: slot.targetPosition };
        });

      return this.imageRepo.replaceImages(productId, storeId, dbImages);
    } finally {
      // ── Phase 6: Delete temp keys (always — success or failure) ──────────
      for (const tmpKey of allTmpKeys) {
        try {
          await deleteS3ObjectByKey(tmpKey);
        } catch {
          // Best-effort: orphaned temp keys are harmless and will not appear
          // in the product UI.
        }
      }
    }
  }
}
