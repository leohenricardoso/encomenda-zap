import { NextResponse } from "next/server";
import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import { ok, created, errorResponse } from "@/shared/http";
import {
  withAuth,
  type AuthenticatedRequest,
} from "@/infra/http/middleware/withAuth";
import type { ListPickupSlotsUseCase } from "@/application/pickupSlot/ListPickupSlotsUseCase";
import type { CreatePickupSlotUseCase } from "@/application/pickupSlot/CreatePickupSlotUseCase";
import type { TogglePickupSlotUseCase } from "@/application/pickupSlot/TogglePickupSlotUseCase";
import type { GetPublicPickupSlotsUseCase } from "@/application/pickupSlot/GetPublicPickupSlotsUseCase";

/**
 * StorePickupSlotController — HTTP adapter for pickup-slot management.
 *
 * Admin routes (authenticated, storeId from session):
 *   GET  /api/pickup-slots                — list all slots (optionally filter by ?dayOfWeek=)
 *   POST /api/pickup-slots                — create a new slot
 *   PATCH /api/pickup-slots/:id           — activate / deactivate
 *
 * Public route (unauthenticated, storeId resolved from storeSlug):
 *   GET  /api/catalog/:storeSlug/pickup-slots  — active slots for customer flow
 *                                               (optional ?dayOfWeek=N)
 */
export class StorePickupSlotController {
  constructor(
    private readonly listSlotsUseCase: ListPickupSlotsUseCase,
    private readonly createSlotUseCase: CreatePickupSlotUseCase,
    private readonly toggleSlotUseCase: TogglePickupSlotUseCase,
    private readonly getPublicSlotsUseCase: GetPublicPickupSlotsUseCase,
  ) {}

  // ─── GET /api/pickup-slots ──────────────────────────────────────────────────

  readonly list = withAuth(
    async (req: AuthenticatedRequest): Promise<NextResponse> => {
      const { searchParams } = new URL(req.url);
      const raw = searchParams.get("dayOfWeek");
      const dayOfWeek = raw !== null ? Number(raw) : undefined;

      try {
        const result = await this.listSlotsUseCase.execute({
          storeId: req.session.storeId,
          dayOfWeek,
          activeOnly: false,
        });
        return ok(result);
      } catch (err) {
        return errorResponse(
          err instanceof AppError ? err : new AppError("Unexpected error."),
        );
      }
    },
  );

  // ─── POST /api/pickup-slots ─────────────────────────────────────────────────

  readonly create = withAuth(
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
        const slot = await this.createSlotUseCase.execute({
          storeId: req.session.storeId,
          dayOfWeek: Number(body.dayOfWeek),
          startTime: String(body.startTime ?? ""),
          endTime: String(body.endTime ?? ""),
        });
        return created(slot);
      } catch (err) {
        return errorResponse(
          err instanceof AppError ? err : new AppError("Unexpected error."),
        );
      }
    },
  );

  // ─── PATCH /api/pickup-slots/:id ────────────────────────────────────────────

  readonly toggle = withAuth(
    async (
      req: AuthenticatedRequest,
      ...args: unknown[]
    ): Promise<NextResponse> => {
      const ctx = (args[0] ?? {}) as { params: Promise<{ id: string }> };
      const { id } = await ctx.params;

      let body: Record<string, unknown>;
      try {
        body = (await req.json()) as Record<string, unknown>;
      } catch {
        return errorResponse(
          new AppError("Invalid JSON body.", HttpStatus.BAD_REQUEST),
        );
      }

      if (typeof body.isActive !== "boolean") {
        return errorResponse(
          new AppError("'isActive' must be a boolean.", HttpStatus.BAD_REQUEST),
        );
      }

      try {
        const slot = await this.toggleSlotUseCase.execute({
          id,
          storeId: req.session.storeId,
          isActive: body.isActive,
        });
        return ok(slot);
      } catch (err) {
        return errorResponse(
          err instanceof AppError ? err : new AppError("Unexpected error."),
        );
      }
    },
  );

  // ─── GET /api/catalog/:storeSlug/pickup-slots (public) ─────────────────────

  readonly listPublic = async (
    req: Request,
    ...args: unknown[]
  ): Promise<NextResponse> => {
    const ctx = (args[0] ?? {}) as { params: Promise<{ storeSlug: string }> };
    const { storeSlug } = await ctx.params;
    const { searchParams } = new URL(req.url);
    const raw = searchParams.get("dayOfWeek");
    const dayOfWeek = raw !== null ? Number(raw) : undefined;

    try {
      const result = await this.getPublicSlotsUseCase.execute(
        storeSlug,
        dayOfWeek,
      );
      return ok(result);
    } catch (err) {
      return errorResponse(
        err instanceof AppError ? err : new AppError("Unexpected error."),
      );
    }
  };
}
