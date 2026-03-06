import { S3Client } from "@aws-sdk/client-s3";

/**
 * Reusable S3 client singleton.
 *
 * Credentials are resolved from environment variables:
 *   AWS_ACCESS_KEY_ID
 *   AWS_SECRET_ACCESS_KEY
 *   AWS_REGION
 *
 * In production these should be set in the deployment environment.
 * Locally, copy .env.example to .env and fill in the values.
 */
const region = process.env.AWS_REGION ?? "sa-east-1";

export const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

export const S3_BUCKET = process.env.AWS_S3_BUCKET ?? "";
