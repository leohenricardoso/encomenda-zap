import { NextResponse } from "next/server";
import {
  withAuth,
  type AuthenticatedRequest,
} from "@/infra/http/middleware/withAuth";
import { getProductById } from "@/domain/product/useCases/getProductById";
import { updateProduct } from "@/domain/product/useCases/updateProduct";
import { deleteProduct } from "@/domain/product/useCases/deleteProduct";
import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import { ok, noContent, errorResponse } from "@/shared/http";

// Helper to extract the dynamic segment in Next.js 15+ (params is a Promise)
async function getId(args: unknown[]): Promise<string> {
  const ctx = (args[0] ?? {}) as { params: Promise<{ id: string }> };
  const { id } = await ctx.params;
  return id;
}

// ─── GET /api/products/:id ────────────────────────────────────────────────────

export const GET = withAuth(
  async (
    req: AuthenticatedRequest,
    ...args: unknown[]
  ): Promise<NextResponse> => {
    const id = await getId(args);
    try {
      const product = await getProductById(id, req.session.storeId);
      return ok(product);
    } catch (err) {
      return errorResponse(
        err instanceof AppError ? err : new AppError("Unexpected error."),
      );
    }
  },
);

// ─── PUT /api/products/:id ────────────────────────────────────────────────────

export const PUT = withAuth(
  async (
    req: AuthenticatedRequest,
    ...args: unknown[]
  ): Promise<NextResponse> => {
    const id = await getId(args);

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return errorResponse(
        new AppError("Invalid JSON body.", HttpStatus.BAD_REQUEST),
      );
    }

    const { name, description, price, isActive } = body;

    try {
      const product = await updateProduct(id, req.session.storeId, {
        ...(name !== undefined && { name: String(name) }),
        ...(description !== undefined && { description: String(description) }),
        ...(price !== undefined && { price: Number(price) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      });
      return ok(product);
    } catch (err) {
      return errorResponse(
        err instanceof AppError ? err : new AppError("Unexpected error."),
      );
    }
  },
);

// ─── DELETE /api/products/:id ─────────────────────────────────────────────────

export const DELETE = withAuth(
  async (
    req: AuthenticatedRequest,
    ...args: unknown[]
  ): Promise<NextResponse> => {
    const id = await getId(args);
    try {
      await deleteProduct(id, req.session.storeId);
      return noContent();
    } catch (err) {
      return errorResponse(
        err instanceof AppError ? err : new AppError("Unexpected error."),
      );
    }
  },
);
