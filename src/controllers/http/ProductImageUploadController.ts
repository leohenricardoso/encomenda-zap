import { NextResponse } from "next/server";
import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import { created, errorResponse } from "@/shared/http";
import {
  withAuth,
  type AuthenticatedRequest,
} from "@/infra/http/middleware/withAuth";
import type { UploadProductImageUseCase } from "@/application/productImage/UploadProductImageUseCase";

// ─── Controller ───────────────────────────────────────────────────────────────

/**
 * ProductImageUploadController
 *
 * HTTP adapter for multipart product image upload.
 *
 * Route handled:
 *   POST /api/products/[productId]/images/upload
 *
 * Expected request: multipart/form-data with a single "file" field.
 *
 * storeId is always sourced from the authenticated session, never the client.
 */
export class ProductImageUploadController {
  constructor(private readonly uploadUseCase: UploadProductImageUseCase) {}

  // ─── POST /api/products/[productId]/images/upload ─────────────────────────

  readonly upload = withAuth(
    async (
      req: AuthenticatedRequest,
      ...args: unknown[]
    ): Promise<NextResponse> => {
      try {
        // ── Extract productId from route params ────────────────────────────
        const ctx = (args[0] ?? {}) as {
          params: Promise<Record<string, string>>;
        };
        const params = await ctx.params;
        const productId = params["id"] ?? "";

        if (!productId) {
          throw new AppError("Missing productId.", HttpStatus.BAD_REQUEST);
        }

        // ── Parse multipart form data ──────────────────────────────────────
        let formData: FormData;
        try {
          formData = await req.formData();
        } catch {
          throw new AppError(
            "Failed to parse multipart request.",
            HttpStatus.BAD_REQUEST,
          );
        }

        const fileField = formData.get("file");

        if (!fileField || !(fileField instanceof File)) {
          throw new AppError(
            'Missing "file" field in multipart body.',
            HttpStatus.BAD_REQUEST,
          );
        }

        // ── Convert to Buffer immediately — do not retain Web File object ──
        const arrayBuffer = await fileField.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // ── Delegate to use case ───────────────────────────────────────────
        const image = await this.uploadUseCase.execute(
          productId,
          req.session.storeId,
          {
            buffer,
            mimeType: fileField.type,
            size: fileField.size,
          },
        );

        return created({
          id: image.id,
          imageUrl: image.imageUrl,
          position: image.position,
        });
      } catch (err) {
        return errorResponse(
          err instanceof AppError ? err : new AppError("Unexpected error."),
        );
      }
    },
  );
}
