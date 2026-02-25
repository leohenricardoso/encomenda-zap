import { NextResponse } from "next/server";
import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import { ok, noContent, errorResponse } from "@/shared/http";
import {
  withAuth,
  type AuthenticatedRequest,
} from "@/infra/http/middleware/withAuth";
import type { GetCepRangeUseCase } from "@/application/cepRange/GetCepRangeUseCase";
import type { AddCepRangeUseCase } from "@/application/cepRange/UpsertCepRangeUseCase";
import type { DeleteCepRangeUseCase } from "@/application/cepRange/DeleteCepRangeUseCase";
import type { ValidateCepUseCase } from "@/application/cepRange/ValidateCepUseCase";

/**
 * StoreCepRangeController â€” HTTP adapter for CEP range management.
 *
 * Admin routes (authenticated, storeId from session):
 *   GET    /api/cep-range          â€” list all ranges
 *   POST   /api/cep-range          â€” add a new range
 *   DELETE /api/cep-range/:id      â€” remove a specific range
 *
 * Public route (unauthenticated, storeId resolved from storeSlug):
 *   GET  /api/catalog/:storeSlug/validate-cep?cep=01310000
 */
export class StoreCepRangeController {
  constructor(
    private readonly getUseCase: GetCepRangeUseCase,
    private readonly addUseCase: AddCepRangeUseCase,
    private readonly deleteUseCase: DeleteCepRangeUseCase,
    private readonly validateUseCase: ValidateCepUseCase,
  ) {}

  // â”€â”€â”€ GET /api/cep-range â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  readonly get = withAuth(
    async (req: AuthenticatedRequest): Promise<NextResponse> => {
      try {
        const ranges = await this.getUseCase.execute(req.session.storeId);
        return ok({ ranges });
      } catch (err) {
        return errorResponse(
          err instanceof AppError ? err : new AppError("Unexpected error."),
        );
      }
    },
  );

  // â”€â”€â”€ POST /api/cep-range â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  readonly add = withAuth(
    async (req: AuthenticatedRequest): Promise<NextResponse> => {
      let body: Record<string, unknown>;
      try {
        body = (await req.json()) as Record<string, unknown>;
      } catch {
        return errorResponse(
          new AppError("Invalid JSON body.", HttpStatus.BAD_REQUEST),
        );
      }

      try {
        const range = await this.addUseCase.execute(
          req.session.storeId,
          String(body.cepStart ?? ""),
          String(body.cepEnd ?? ""),
        );
        return ok({ range });
      } catch (err) {
        return errorResponse(
          err instanceof AppError ? err : new AppError("Unexpected error."),
        );
      }
    },
  );

  // â”€â”€â”€ DELETE /api/cep-range/:id â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  readonly remove = withAuth(
    async (
      req: AuthenticatedRequest,
      ...args: unknown[]
    ): Promise<NextResponse> => {
      const ctx = (args[0] ?? {}) as { params: Promise<{ id: string }> };
      const { id } = await ctx.params;

      try {
        await this.deleteUseCase.execute(id, req.session.storeId);
        return noContent();
      } catch (err) {
        return errorResponse(
          err instanceof AppError ? err : new AppError("Unexpected error."),
        );
      }
    },
  );

  // â”€â”€â”€ GET /api/catalog/:storeSlug/validate-cep â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  readonly validatePublic = async (
    req: Request,
    ...args: unknown[]
  ): Promise<NextResponse> => {
    const ctx = (args[0] ?? {}) as {
      params: Promise<{ storeSlug: string }>;
    };
    const { storeSlug } = await ctx.params;
    const { searchParams } = new URL(req.url);
    const cep = searchParams.get("cep") ?? "";

    try {
      const result = await this.validateUseCase.execute(storeSlug, cep);
      return ok(result);
    } catch (err) {
      return errorResponse(
        err instanceof AppError ? err : new AppError("Unexpected error."),
      );
    }
  };
}

