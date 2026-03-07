import { S3Client } from "@aws-sdk/client-s3";

/**
 * Reusable S3 client singleton.
 *
 * Required environment variables:
 *   AWS_ACCESS_KEY_ID
 *   AWS_SECRET_ACCESS_KEY
 *   AWS_REGION      — must match the bucket's region
 *   AWS_S3_BUCKET   — exact bucket name
 *
 * followRegionRedirects — if the client region differs from the bucket's
 * actual region, the SDK automatically retries against the correct regional
 * endpoint instead of throwing PermanentRedirect.
 */
export const AWS_REGION = process.env.AWS_REGION ?? "us-east-1";

export const S3_BUCKET = process.env.AWS_S3_BUCKET ?? "";

if (!S3_BUCKET) {
  // Fail fast at import time so the error is obvious in logs.
  console.warn("[s3Client] AWS_S3_BUCKET is not set. Image uploads will fail.");
}

export const s3Client = new S3Client({
  region: AWS_REGION,
  // Automatically follow region-redirect responses (PermanentRedirect)
  // so uploads succeed even if AWS_REGION does not match the bucket region.
  followRegionRedirects: true,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});
