import { NextResponse } from "next/server";
import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import { ok, errorResponse } from "@/shared/http";
import {
  withAuth,
  type AuthenticatedRequest,
} from "@/infra/http/middleware/withAuth";
import type { GetStoreScheduleUseCase } from "@/application/schedule/GetStoreScheduleUseCase";
import type { SetDayAvailabilityUseCase } from "@/application/schedule/SetDayAvailabilityUseCase";

/**
 * StoreScheduleController — HTTP adapter for the store schedule feature.
 *
 * Responsibilities (thin controller):
 * 1. Authenticate via withAuth HOF
 * 2. Extract storeId from req.session (never from client input)
 * 3. Coerce + forward query/body params to use cases
 * 4. Map results to NextResponse
 *
 * Routes:
 *   GET  /api/schedule?from=YYYY-MM-DD&to=YYYY-MM-DD  → list schedule window
 *   PATCH /api/schedule/:date                          → set day availability
 */
export class StoreScheduleController {
  constructor(
    private readonly getScheduleUseCase: GetStoreScheduleUseCase,
    private readonly setDayAvailabilityUseCase: SetDayAvailabilityUseCase,
  ) {}

  // ─── GET /api/schedule ──────────────────────────────────────────────────────

  readonly list = withAuth(
    async (req: AuthenticatedRequest): Promise<NextResponse> => {
      const { searchParams } = new URL(req.url);
      const from = searchParams.get("from") ?? undefined;
      const to = searchParams.get("to") ?? undefined;

      try {
        const result = await this.getScheduleUseCase.execute({
          storeId: req.session.storeId,
          from,
          to,
        });
        return ok(result);
      } catch (err) {
        return errorResponse(
          err instanceof AppError ? err : new AppError("Unexpected error."),
        );
      }
    },
  );

  // ─── PATCH /api/schedule/:date ──────────────────────────────────────────────

  readonly setDay = withAuth(
    async (
      req: AuthenticatedRequest,
      ...args: unknown[]
    ): Promise<NextResponse> => {
      const ctx = (args[0] ?? {}) as { params: Promise<{ date: string }> };
      const { date } = await ctx.params;

      let body: Record<string, unknown>;
      try {
        body = await req.json();
      } catch {
        return errorResponse(
          new AppError("Invalid JSON body.", HttpStatus.BAD_REQUEST),
        );
      }

      if (typeof body.isOpen !== "boolean") {
        return errorResponse(
          new AppError("'isOpen' must be a boolean.", HttpStatus.BAD_REQUEST),
        );
      }

      try {
        const result = await this.setDayAvailabilityUseCase.execute({
          storeId: req.session.storeId,
          date,
          isOpen: body.isOpen,
        });
        return ok(result);
      } catch (err) {
        return errorResponse(
          err instanceof AppError ? err : new AppError("Unexpected error."),
        );
      }
    },
  );
}
