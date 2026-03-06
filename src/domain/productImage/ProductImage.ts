/**
 * ProductImage domain entity.
 *
 * Represents one image associated with a Product, identified by its
 * public URL (e.g. an S3 object URL).  Up to 3 images per product.
 *
 * position:
 *   - 1 = primary / main catalog image
 *   - 2 = secondary
 *   - 3 = tertiary
 *
 * Positions are unique per product and form a contiguous sequence
 * starting at 1 when at least one image exists.
 *
 * Multi-tenancy: storeId is denormalised from Product so every query
 * can be tenant-scoped without an extra join.
 */

// ─── Entity ───────────────────────────────────────────────────────────────────

export interface ProductImage {
  id: string;
  productId: string;
  /** Denormalised from Product — enables tenant-scoped queries. */
  storeId: string;
  /** Publicly accessible image URL (e.g. https://bucket.s3.region.amazonaws.com/…). */
  imageUrl: string;
  /** Display order: 1 = main image. Unique per product. */
  position: number;
  createdAt: Date;
}

// ─── Input types ──────────────────────────────────────────────────────────────

export interface CreateProductImageInput {
  productId: string;
  storeId: string;
  imageUrl: string;
  position: number;
}
