import { NextResponse } from "next/server";
import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import { ok, created, noContent, errorResponse } from "@/shared/http";
import {
  withAuth,
  type AuthenticatedRequest,
} from "@/infra/http/middleware/withAuth";
import type { CreateProductUseCase } from "@/application/product/CreateProductUseCase";
import type { ListProductsUseCase } from "@/application/product/ListProductsUseCase";
import type { GetProductByIdUseCase } from "@/application/product/GetProductByIdUseCase";
import type { UpdateProductUseCase } from "@/application/product/UpdateProductUseCase";
import type { DeleteProductUseCase } from "@/application/product/DeleteProductUseCase";

// ─── Controller ───────────────────────────────────────────────────────────────

/**
 * ProductController — HTTP adapter for product CRUD operations.
 *
 * Responsibilities (and ONLY these):
 * 1. Authenticate request via withAuth HOF
 * 2. Extract storeId from req.session (never from the request body)
 * 3. Extract and coerce params/body values
 * 4. Call the appropriate application use case
 * 5. Map the result to a NextResponse
 *
 * NestJS migration:
 * - Decorate class with @Controller('products')
 * - Inject use cases via constructor @Inject()
 * - Replace withAuth with @UseGuards(JwtAuthGuard)
 * - storeId comes from @CurrentUser() decorator on the request
 */
export class ProductController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly listProductsUseCase: ListProductsUseCase,
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
  ) {}

  // ─── POST /api/products ─────────────────────────────────────────────────────

  readonly create = withAuth(
    async (req: AuthenticatedRequest): Promise<NextResponse> => {
      const body = await this.parseJsonBody(req);
      const { name, description, price, isActive } = body;

      try {
        const product = await this.createProductUseCase.execute({
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
        );
      }
    },
  );

  // ─── GET /api/products ──────────────────────────────────────────────────────

  readonly list = withAuth(
    async (req: AuthenticatedRequest): Promise<NextResponse> => {
      try {
        const products = await this.listProductsUseCase.execute(
          req.session.storeId,
        );
        return ok(products);
      } catch (err) {
        return errorResponse(
          err instanceof AppError ? err : new AppError("Unexpected error."),
        );
      }
    },
  );

  // ─── GET /api/products/:id ──────────────────────────────────────────────────

  readonly getById = withAuth(
    async (
      req: AuthenticatedRequest,
      ...args: unknown[]
    ): Promise<NextResponse> => {
      const id = await this.extractId(args);
      try {
        const product = await this.getProductByIdUseCase.execute(
          id,
          req.session.storeId,
        );
        return ok(product);
      } catch (err) {
        return errorResponse(
          err instanceof AppError ? err : new AppError("Unexpected error."),
        );
      }
    },
  );

  // ─── PUT /api/products/:id ──────────────────────────────────────────────────

  readonly update = withAuth(
    async (
      req: AuthenticatedRequest,
      ...args: unknown[]
    ): Promise<NextResponse> => {
      const id = await this.extractId(args);
      const body = await this.parseJsonBody(req);
      const { name, description, price, isActive } = body;

      try {
        const product = await this.updateProductUseCase.execute(
          id,
          req.session.storeId,
          {
            ...(name !== undefined && { name: String(name) }),
            ...(description !== undefined && {
              description: String(description),
            }),
            ...(price !== undefined && { price: Number(price) }),
            ...(isActive !== undefined && { isActive: Boolean(isActive) }),
          },
        );
        return ok(product);
      } catch (err) {
        return errorResponse(
          err instanceof AppError ? err : new AppError("Unexpected error."),
        );
      }
    },
  );

  // ─── DELETE /api/products/:id ────────────────────────────────────────────────

  readonly delete = withAuth(
    async (
      req: AuthenticatedRequest,
      ...args: unknown[]
    ): Promise<NextResponse> => {
      const id = await this.extractId(args);
      try {
        await this.deleteProductUseCase.execute(id, req.session.storeId);
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

  private async extractId(args: unknown[]): Promise<string> {
    const ctx = (args[0] ?? {}) as { params: Promise<{ id: string }> };
    const { id } = await ctx.params;
    return id;
  }
}
