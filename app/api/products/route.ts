import { NextRequest, NextResponse } from "next/server";
import {
  withAuth,
  type AuthenticatedRequest,
} from "@/infra/http/middleware/withAuth";
import { createProduct } from "@/domain/product/useCases/createProduct";
import { listProducts } from "@/domain/product/useCases/listProducts";
import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import { ok, created, errorResponse } from "@/shared/http";

// ─── POST /api/products ───────────────────────────────────────────────────────

export const POST = withAuth(
  async (req: AuthenticatedRequest): Promise<NextResponse> => {
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
      const product = await createProduct({
        storeId: req.session.storeId,
        name: String(name ?? ""),
        description:
          description !== undefined ? String(description) : undefined,
        price: Number(price),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      });
      return created(product);
    } catch (err) {
      return errorResponse(
        err instanceof AppError ? err : new AppError("Unexpected error."),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  },
);

// ─── GET /api/products ────────────────────────────────────────────────────────

export const GET = withAuth(
  async (req: AuthenticatedRequest): Promise<NextResponse> => {
    try {
      const products = await listProducts(req.session.storeId);
      return ok(products);
    } catch (err) {
      return errorResponse(
        err instanceof AppError ? err : new AppError("Unexpected error."),
      );
    }
  },
);
