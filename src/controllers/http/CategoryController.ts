import { NextResponse } from "next/server";
import { AppError } from "@/shared/errors/AppError";
import { ok, created, noContent, errorResponse } from "@/shared/http";
import {
  withAuth,
  type AuthenticatedRequest,
} from "@/infra/http/middleware/withAuth";
import type { ListCategoriesUseCase } from "@/application/category/ListCategoriesUseCase";
import type { CreateCategoryUseCase } from "@/application/category/CreateCategoryUseCase";
import type { UpdateCategoryUseCase } from "@/application/category/UpdateCategoryUseCase";
import type { DeleteCategoryUseCase } from "@/application/category/DeleteCategoryUseCase";
import type { AssignProductToCategoryUseCase } from "@/application/category/AssignProductToCategoryUseCase";
import type { RemoveProductFromCategoryUseCase } from "@/application/category/RemoveProductFromCategoryUseCase";
import type { ReorderCategoryProductsUseCase } from "@/application/category/ReorderCategoryProductsUseCase";
import type { GetCategoryProductsUseCase } from "@/application/category/GetCategoryProductsUseCase";
import type { UpdateCategoryOrderUseCase } from "@/application/category/UpdateCategoryOrderUseCase";

export class CategoryController {
  constructor(
    private readonly listCategoriesUseCase: ListCategoriesUseCase,
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
    private readonly deleteCategoryUseCase: DeleteCategoryUseCase,
    private readonly assignProductToCategoryUseCase: AssignProductToCategoryUseCase,
    private readonly removeProductFromCategoryUseCase: RemoveProductFromCategoryUseCase,
    private readonly reorderCategoryProductsUseCase: ReorderCategoryProductsUseCase,
    private readonly getCategoryProductsUseCase: GetCategoryProductsUseCase,
    private readonly updateCategoryOrderUseCase: UpdateCategoryOrderUseCase,
  ) {}

  // ─── GET /api/categories ────────────────────────────────────────────────────

  readonly list = withAuth(
    async (req: AuthenticatedRequest): Promise<NextResponse> => {
      try {
        const categories = await this.listCategoriesUseCase.execute(
          req.session.storeId,
        );
        return ok(categories);
      } catch (err) {
        return errorResponse(
          err instanceof AppError ? err : new AppError("Unexpected error."),
        );
      }
    },
  );

  // ─── POST /api/categories ───────────────────────────────────────────────────

  readonly create = withAuth(
    async (req: AuthenticatedRequest): Promise<NextResponse> => {
      const body = await this.parseJsonBody(req);
      const { name, isActive } = body;
      try {
        const category = await this.createCategoryUseCase.execute(
          req.session.storeId,
          String(name ?? ""),
          isActive !== undefined ? Boolean(isActive) : true,
        );
        return created(category);
      } catch (err) {
        return errorResponse(
          err instanceof AppError ? err : new AppError("Unexpected error."),
        );
      }
    },
  );

  // ─── PATCH /api/categories/[id] ─────────────────────────────────────────────

  readonly update = withAuth(
    async (
      req: AuthenticatedRequest,
      ...args: unknown[]
    ): Promise<NextResponse> => {
      const id = await this.extractId(args);
      const body = await this.parseJsonBody(req);
      const { name, isActive } = body;
      try {
        const category = await this.updateCategoryUseCase.execute(
          id,
          req.session.storeId,
          {
            name: name !== undefined ? String(name) : undefined,
            isActive: isActive !== undefined ? Boolean(isActive) : undefined,
          },
        );
        return ok(category);
      } catch (err) {
        return errorResponse(
          err instanceof AppError ? err : new AppError("Unexpected error."),
        );
      }
    },
  );

  // ─── DELETE /api/categories/[id] ────────────────────────────────────────────

  readonly delete = withAuth(
    async (
      req: AuthenticatedRequest,
      ...args: unknown[]
    ): Promise<NextResponse> => {
      const id = await this.extractId(args);
      try {
        await this.deleteCategoryUseCase.execute(id, req.session.storeId);
        return noContent();
      } catch (err) {
        return errorResponse(
          err instanceof AppError ? err : new AppError("Unexpected error."),
        );
      }
    },
  );

  // ─── GET /api/categories/[id]/products ──────────────────────────────────────

  readonly listProducts = withAuth(
    async (
      req: AuthenticatedRequest,
      ...args: unknown[]
    ): Promise<NextResponse> => {
      const categoryId = await this.extractId(args);
      try {
        const products = await this.getCategoryProductsUseCase.execute(
          categoryId,
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

  // ─── POST /api/categories/[id]/products ─────────────────────────────────────

  readonly assignProduct = withAuth(
    async (
      req: AuthenticatedRequest,
      ...args: unknown[]
    ): Promise<NextResponse> => {
      const categoryId = await this.extractId(args);
      const body = await this.parseJsonBody(req);
      const { productId } = body;
      try {
        await this.assignProductToCategoryUseCase.execute(
          String(productId ?? ""),
          categoryId,
          req.session.storeId,
        );
        return noContent();
      } catch (err) {
        return errorResponse(
          err instanceof AppError ? err : new AppError("Unexpected error."),
        );
      }
    },
  );

  // ─── DELETE /api/categories/[id]/products/[productId] ───────────────────────

  readonly removeProduct = withAuth(
    async (
      req: AuthenticatedRequest,
      ...args: unknown[]
    ): Promise<NextResponse> => {
      const { id: categoryId, productId } =
        await this.extractIdAndProductId(args);
      try {
        await this.removeProductFromCategoryUseCase.execute(
          productId,
          categoryId,
          req.session.storeId,
        );
        return noContent();
      } catch (err) {
        return errorResponse(
          err instanceof AppError ? err : new AppError("Unexpected error."),
        );
      }
    },
  );

  // ─── PATCH /api/categories/[id]/products/reorder ────────────────────────────

  readonly reorderProducts = withAuth(
    async (
      req: AuthenticatedRequest,
      ...args: unknown[]
    ): Promise<NextResponse> => {
      const categoryId = await this.extractId(args);
      const body = await this.parseJsonBody(req);
      const { orderedProductIds } = body;
      try {
        await this.reorderCategoryProductsUseCase.execute(
          categoryId,
          req.session.storeId,
          Array.isArray(orderedProductIds) ? orderedProductIds.map(String) : [],
        );
        return noContent();
      } catch (err) {
        return errorResponse(
          err instanceof AppError ? err : new AppError("Unexpected error."),
        );
      }
    },
  );

  // ─── PATCH /api/categories/reorder ───────────────────────────────────────────

  readonly reorderCategories = withAuth(
    async (req: AuthenticatedRequest): Promise<NextResponse> => {
      const body = await this.parseJsonBody(req);
      const { items } = body;
      try {
        const parsed = Array.isArray(items)
          ? items.map((i: unknown) => {
              const item = i as Record<string, unknown>;
              return {
                id: String(item.id ?? ""),
                position: Number(item.position ?? 0),
              };
            })
          : [];
        await this.updateCategoryOrderUseCase.execute(
          req.session.storeId,
          parsed,
        );
        return noContent();
      } catch (err) {
        return errorResponse(
          err instanceof AppError ? err : new AppError("Unexpected error."),
        );
      }
    },
  );

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async parseJsonBody(req: Request): Promise<Record<string, unknown>> {
    try {
      return (await req.json()) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  private async extractId(args: unknown[]): Promise<string> {
    const ctx = (args[0] ?? {}) as { params: Promise<{ id: string }> };
    const { id } = await ctx.params;
    return id;
  }

  private async extractIdAndProductId(
    args: unknown[],
  ): Promise<{ id: string; productId: string }> {
    const ctx = (args[0] ?? {}) as {
      params: Promise<{ id: string; productId: string }>;
    };
    return ctx.params;
  }
}
