import { NextResponse } from "next/server";
import { AppError } from "@/shared/errors/AppError";
import { ok, errorResponse } from "@/shared/http";
import { HttpStatus } from "@/shared/http/statuses";
import {
  withAuth,
  type AuthenticatedRequest,
} from "@/infra/http/middleware/withAuth";
import type { ToggleChecklistItemUseCase } from "@/application/production/ToggleChecklistItemUseCase";

// ─── Controller ───────────────────────────────────────────────────────────────

/**
 * DailyProductionController — HTTP adapter for the "Produção do Dia" feature.
 *
 * The GET endpoint (data fetch) does not live here — production data is fetched
 * directly by the Server Component via the GetDailyProductionUseCase, avoiding
 * an unnecessary HTTP round-trip.
 *
 * This controller only handles the POST /api/production/checklist toggle
 * mutation originating from the client-side board component.
 */
export class DailyProductionController {
  constructor(
    private readonly toggleChecklistItemUseCase: ToggleChecklistItemUseCase,
  ) {}

  // ─── POST /api/production/checklist ─────────────────────────────────────────

  readonly toggleItem = withAuth(
    async (req: AuthenticatedRequest): Promise<NextResponse> => {
      let body: Record<string, unknown>;
      try {
        body = (await req.json()) as Record<string, unknown>;
      } catch {
        return errorResponse("Invalid JSON body.", HttpStatus.BAD_REQUEST);
      }

      const { date, itemKey } = body;

      if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return errorResponse(
          "date must be a string in YYYY-MM-DD format.",
          HttpStatus.BAD_REQUEST,
        );
      }

      if (typeof itemKey !== "string" || itemKey.trim() === "") {
        return errorResponse(
          "itemKey must be a non-empty string.",
          HttpStatus.BAD_REQUEST,
        );
      }

      try {
        const result = await this.toggleChecklistItemUseCase.execute({
          storeId: req.session.storeId,
          date,
          itemKey,
        });
        return ok(result);
      } catch (err) {
        if (err instanceof AppError) {
          return errorResponse(err.message, HttpStatus.UNPROCESSABLE_ENTITY);
        }
        return errorResponse(
          "Erro ao atualizar checklist.",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    },
  );
}
