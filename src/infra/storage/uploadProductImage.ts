import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, S3_BUCKET } from "./s3Client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadProductImageInput {
  buffer: Buffer;
  storeId: string;
  productId: string;
  position: number;
  mimeType: string;
}

export interface UploadProductImageResult {
  key: string;
  imageUrl: string;
}

// ─── Implementation ───────────────────────────────────────────────────────────

/**
 * uploadProductImage
 *
 * Uploads a product image buffer to S3 under a deterministic key:
 *   products/{storeId}/{productId}/{position}.jpg
 *
 * The key is intentionally stable — uploading a new image to the same
 * position overwrites the previous one in S3 (immutable URL semantics).
 *
 * Returns the public URL of the uploaded object.
 */
export async function uploadProductImage({
  buffer,
  storeId,
  productId,
  position,
  mimeType,
}: UploadProductImageInput): Promise<UploadProductImageResult> {
  const key = `products/${storeId}/${productId}/${position}.jpg`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      // Objects are publicly accessible via bucket policy — no ACL needed
      // when the bucket has public-read access via resource-based policy.
    }),
  );

  const region = process.env.AWS_REGION ?? "sa-east-1";
  const imageUrl = `https://${S3_BUCKET}.s3.${region}.amazonaws.com/${key}`;

  return { key, imageUrl };
}
