import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, S3_BUCKET } from "./s3Client";

/**
 * deleteProductImage
 *
 * Extracts the S3 key from a public URL and removes the object from the
 * configured bucket.
 *
 * Key extraction works by parsing the URL pathname, which is the path
 * component after the S3 host — format:
 *   https://{bucket}.s3.{region}.amazonaws.com/{key}
 *
 * We strip the leading "/" from the pathname to get the raw key, e.g.:
 *   URL  : https://bucket.s3.sa-east-1.amazonaws.com/products/store/prod/1.jpg
 *   key  : products/store/prod/1.jpg
 */
export async function deleteProductImage(imageUrl: string): Promise<void> {
  let key: string;
  try {
    const { pathname } = new URL(imageUrl);
    key = pathname.startsWith("/") ? pathname.slice(1) : pathname;
  } catch {
    throw new Error(`Cannot extract S3 key from URL: "${imageUrl}"`);
  }

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    }),
  );
}
