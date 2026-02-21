import { NextResponse } from "next/server";
import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import { ok, created, noContent, errorResponse } from "@/shared/http";
import {
  withAuth,
  type AuthenticatedRequest,
} from "@/infra/http/middleware/withAuth";
import type { CreateVariantUseCase } from "@/application/product/CreateVariantUseCase";
import type { UpdateVariantUseCase } from "@/application/product/UpdateVariantUseCase";
import type { DeleteVariantUseCase } from "@/application/product/DeleteVariantUseCase";
import type { PricingType } from "@/domain/product/Product";

// ─── Controller ───────────────────────────────────────────────────────────────

/**
 * ProductVariantController — HTTP adapter for variant CRUD under a product.
 *
 * Routes:
 *   POST   /api/products/:id/variants
 *   PUT    /api/products/:id/variants/:variantId
 *   DELETE /api/products/:id/variants/:variantId
 */
export class ProductVariantController {
  constructor(
    private readonly createVariantUseCase: CreateVariantUseCase,
    private readonly updateVariantUseCase: UpdateVariantUseCase,
    private readonly deleteVariantUseCase: DeleteVariantUseCase,
  ) {}

  // ─── POST /api/products/:id/variants ────────────────────────────────────────

  readonly create = withAuth(
    async (
      req: AuthenticatedRequest,
      ...args: unknown[]
    ): Promise<NextResponse> => {
      const { productId } = await this.extractIds(args);
      const body = await this.parseJsonBody(req);
      const { label, price, pricingType, isActive, sortOrder } = body;

      try {
        const variant = await this.createVariantUseCase.execute(
          productId,
          req.session.storeId,
          {
            label: String(label ?? ""),
            price: Number(price),
            pricingType: this.parsePricingType(pricingType),
            isActive: isActive !== undefined ? Boolean(isActive) : true,
            sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
          },
        );
        return created(variant);
      } catch (err) {
        return errorResponse(
          err instanceof AppError ? err : new AppError("Unexpected error."),
        );
      }
    },
  );

  // ─── PUT /api/products/:id/variants/:variantId ───────────────────────────────

  readonly update = withAuth(
    async (
      req: AuthenticatedRequest,
      ...args: unknown[]
    ): Promise<NextResponse> => {
      const { variantId } = await this.extractIds(args);
      const body = await this.parseJsonBody(req);
      const { label, price, pricingType, isActive, sortOrder } = body;

      try {
        const variant = await this.updateVariantUseCase.execute(
          variantId,
          req.session.storeId,
          {
            ...(label !== undefined && { label: String(label) }),
            ...(price !== undefined && { price: Number(price) }),
            ...(pricingType !== undefined && {
              pricingType: this.parsePricingType(pricingType),
            }),
            ...(isActive !== undefined && { isActive: Boolean(isActive) }),
            ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
          },
        );
        return ok(variant);
      } catch (err) {
        return errorResponse(
          err instanceof AppError ? err : new AppError("Unexpected error."),
        );
      }
    },
  );

  // ─── DELETE /api/products/:id/variants/:variantId ────────────────────────────

  readonly delete = withAuth(
    async (
      req: AuthenticatedRequest,
      ...args: unknown[]
    ): Promise<NextResponse> => {
      const { variantId } = await this.extractIds(args);

      try {
        await this.deleteVariantUseCase.execute(variantId, req.session.storeId);
        return noContent();
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

  private async extractIds(
    args: unknown[],
  ): Promise<{ productId: string; variantId: string }> {
    const ctx = (args[0] ?? {}) as {
      params: Promise<{ id: string; variantId?: string }>;
    };
    const params = await ctx.params;
    return { productId: params.id, variantId: params.variantId ?? "" };
  }

  private parsePricingType(value: unknown): PricingType {
    return value === "WEIGHT" ? "WEIGHT" : "UNIT";
  }
}
