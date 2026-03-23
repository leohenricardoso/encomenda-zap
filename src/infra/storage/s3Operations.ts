import {
  CopyObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { s3Client, S3_BUCKET } from "./s3Client";

/**
 * Extracts the S3 object key from a full public URL.
 *
 * Works for URLs in the format:
 *   https://{bucket}.s3.{region}.amazonaws.com/{key}
 *
 * Returns the key without the leading "/".
 */
export function extractS3Key(imageUrl: string): string {
  const { pathname } = new URL(imageUrl);
  return pathname.startsWith("/") ? pathname.slice(1) : pathname;
}

/**
 * Copies an S3 object from one key to another within the same bucket.
 *
 * Used by ReplaceProductImagesUseCase to relocate existing images to
 * their new positional keys without re-downloading and re-uploading the
 * raw bytes.
 */
export async function copyS3Object(
  srcKey: string,
  destKey: string,
): Promise<void> {
  await s3Client.send(
    new CopyObjectCommand({
      Bucket: S3_BUCKET,
      CopySource: `${S3_BUCKET}/${srcKey}`,
      Key: destKey,
    }),
  );
}

/**
 * Deletes a single S3 object by its raw key (not a full URL).
 * Safe to call even if the key does not exist — S3 DELETE is idempotent.
 */
export async function deleteS3ObjectByKey(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    }),
  );
}

/**
 * Uploads a buffer directly to a specific S3 key.
 *
 * Unlike uploadProductImage (which derives the key from position), this
 * function lets the caller choose any arbitrary key — used for staging
 * new images under temp keys before the final positional copy.
 */
export async function uploadBufferToS3Key(
  key: string,
  buffer: Buffer,
  mimeType: string,
): Promise<void> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }),
  );
}
