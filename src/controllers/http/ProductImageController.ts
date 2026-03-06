import { NextResponse } from "next/server";
import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import { ok, created, noContent, errorResponse } from "@/shared/http";
import {
  withAuth,
  type AuthenticatedRequest,
} from "@/infra/http/middleware/withAuth";
import type { AddProductImageUseCase } from "@/application/productImage/AddProductImageUseCase";
import type { RemoveProductImageUseCase } from "@/application/productImage/RemoveProductImageUseCase";
import type { GetProductImagesUseCase } from "@/application/productImage/GetProductImagesUseCase";
import type { SetImageAsPrimaryUseCase } from "@/application/productImage/SetImageAsPrimaryUseCase";

// ─── Controller ───────────────────────────────────────────────────────────────

/**
 * ProductImageController — HTTP adapter for product image operations.
 *
 * Routes handled:
 *   GET    /api/products/[id]/images
 *   POST   /api/products/[id]/images         body: { imageUrl: string }
 *   DELETE /api/products/images/[imageId]
 *   PATCH  /api/products/images/[imageId]/primary
 *
 * storeId always comes from the authenticated session, never from the client.
 */
export class ProductImageController {
  constructor(
    private readonly addImageUseCase: AddProductImageUseCase,
    private readonly removeImageUseCase: RemoveProductImageUseCase,
    private readonly getImagesUseCase: GetProductImagesUseCase,
    private readonly setPrimaryUseCase: SetImageAsPrimaryUseCase,
  ) {}

  // ─── GET /api/products/[id]/images ──────────────────────────────────────────

  readonly listImages = withAuth(
    async (
      req: AuthenticatedRequest,
      ...args: unknown[]
    ): Promise<NextResponse> => {
      const productId = await this.extractParamId(args, "id");
      try {
        const images = await this.getImagesUseCase.execute(
          productId,
          req.session.storeId,
        );
        return ok(images);
      } catch (err) {
        return errorResponse(
          err instanceof AppError ? err : new AppError("Unexpected error."),
        );
      }
    },
  );

  // ─── POST /api/products/[id]/images ─────────────────────────────────────────

  readonly addImage = withAuth(
    async (
      req: AuthenticatedRequest,
      ...args: unknown[]
    ): Promise<NextResponse> => {
      const productId = await this.extractParamId(args, "id");
      const body = await this.parseJsonBody(req);
      const { imageUrl } = body;

      try {
        const image = await this.addImageUseCase.execute(
          productId,
          req.session.storeId,
          typeof imageUrl === "string" ? imageUrl : "",
        );
        return created(image);
      } catch (err) {
        return errorResponse(
          err instanceof AppError ? err : new AppError("Unexpected error."),
        );
      }
    },
  );

  // ─── DELETE /api/products/images/[imageId] ───────────────────────────────────

  readonly removeImage = withAuth(
    async (
      req: AuthenticatedRequest,
      ...args: unknown[]
    ): Promise<NextResponse> => {
      const imageId = await this.extractParamId(args, "imageId");
      try {
        await this.removeImageUseCase.execute(imageId, req.session.storeId);
        return noContent();
      } catch (err) {
        return errorResponse(
          err instanceof AppError ? err : new AppError("Unexpected error."),
        );
      }
    },
  );

  // ─── PATCH /api/products/images/[imageId]/primary ────────────────────────────

  readonly setAsPrimary = withAuth(
    async (
      req: AuthenticatedRequest,
      ...args: unknown[]
    ): Promise<NextResponse> => {
      const imageId = await this.extractParamId(args, "imageId");
      try {
        const images = await this.setPrimaryUseCase.execute(
          imageId,
          req.session.storeId,
        );
        return ok(images);
      } catch (err) {
        return errorResponse(
          err instanceof AppError ? err : new AppError("Unexpected error."),
        );
      }
    },
  );

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async parseJsonBody(
    req: AuthenticatedRequest,
  ): Promise<Record<string, unknown>> {
    try {
      return (await req.json()) as Record<string, unknown>;
    } catch {
      throw new AppError("Invalid JSON body.", HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Extracts a dynamic segment from Next.js route context.
   * Compatible with the App Router's Promise-based params API.
   */
  private async extractParamId(
    args: unknown[],
    paramName: string,
  ): Promise<string> {
    const ctx = (args[0] ?? {}) as {
      params: Promise<Record<string, string>>;
    };
    const params = await ctx.params;
    return params[paramName] ?? "";
  }
}
