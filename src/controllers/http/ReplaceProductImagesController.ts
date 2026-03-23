import { NextResponse } from "next/server";
import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import { ok, errorResponse } from "@/shared/http";
import {
  withAuth,
  type AuthenticatedRequest,
} from "@/infra/http/middleware/withAuth";
import type { ReplaceProductImagesUseCase } from "@/application/productImage/ReplaceProductImagesUseCase";
import type { ReplaceSlot } from "@/application/productImage/ReplaceProductImagesUseCase";

// ─── Request payload types ────────────────────────────────────────────────────

interface SlotPayload {
  kind: "existing" | "new";
  /** Present when kind === "existing" — DB image ID. */
  id?: string;
  /** Present when kind === "new" — key used to find the file in FormData. */
  key?: string;
  targetPosition: number;
}

// ─── Controller ───────────────────────────────────────────────────────────────

/**
 * ReplaceProductImagesController
 *
 * HTTP adapter for the full-replace image sync endpoint.
 *
 * Route:
 *   PUT /api/products/[id]/images/replace
 *
 * Request: multipart/form-data
 *   slots     — JSON-encoded SlotPayload[] describing the final ordered image set
 *   file_{key} — one entry per slot with kind="new", where key matches slot.key
 *
 * Response: { success: true, data: ProductImage[] } (ordered by position)
 *
 * storeId is always read from the authenticated session, never from the client.
 */
export class ReplaceProductImagesController {
  constructor(private readonly replaceUseCase: ReplaceProductImagesUseCase) {}

  readonly replace = withAuth(
    async (
      req: AuthenticatedRequest,
      ...args: unknown[]
    ): Promise<NextResponse> => {
      try {
        // ── Extract productId from route params ──────────────────────────────
        const ctx = (args[0] ?? {}) as {
          params: Promise<Record<string, string>>;
        };
        const params = await ctx.params;
        const productId = params["id"] ?? "";

        if (!productId) {
          throw new AppError("Missing productId.", HttpStatus.BAD_REQUEST);
        }

        // ── Parse multipart form data ────────────────────────────────────────
        let formData: FormData;
        try {
          formData = await req.formData();
        } catch {
          throw new AppError(
            "Failed to parse multipart request.",
            HttpStatus.BAD_REQUEST,
          );
        }

        const slotsRaw = formData.get("slots");
        if (!slotsRaw || typeof slotsRaw !== "string") {
          throw new AppError(
            'Missing "slots" field in request body.',
            HttpStatus.BAD_REQUEST,
          );
        }

        let slotPayloads: SlotPayload[];
        try {
          slotPayloads = JSON.parse(slotsRaw) as SlotPayload[];
        } catch {
          throw new AppError(
            '"slots" must be a valid JSON array.',
            HttpStatus.BAD_REQUEST,
          );
        }

        // ── Build use-case input ─────────────────────────────────────────────
        const useCaseSlots: ReplaceSlot[] = [];

        for (const payload of slotPayloads) {
          if (
            typeof payload.targetPosition !== "number" ||
            payload.targetPosition < 1 ||
            payload.targetPosition > 3
          ) {
            throw new AppError(
              "targetPosition must be 1, 2, or 3.",
              HttpStatus.BAD_REQUEST,
            );
          }

          if (payload.kind === "existing") {
            if (!payload.id) {
              throw new AppError(
                'Existing slots require an "id".',
                HttpStatus.BAD_REQUEST,
              );
            }
            useCaseSlots.push({
              kind: "existing",
              id: payload.id,
              targetPosition: payload.targetPosition,
            });
          } else if (payload.kind === "new") {
            if (!payload.key) {
              throw new AppError(
                'New slots require a "key" matching a form file field.',
                HttpStatus.BAD_REQUEST,
              );
            }

            const fileField = formData.get(`file_${payload.key}`);
            if (!fileField || !(fileField instanceof File)) {
              throw new AppError(
                `Missing file for key "${payload.key}".`,
                HttpStatus.BAD_REQUEST,
              );
            }

            const arrayBuffer = await fileField.arrayBuffer();
            useCaseSlots.push({
              kind: "new",
              buffer: Buffer.from(arrayBuffer),
              mimeType: fileField.type,
              size: fileField.size,
              targetPosition: payload.targetPosition,
            });
          } else {
            throw new AppError(
              `Unknown slot kind "${(payload as { kind: string }).kind}".`,
              HttpStatus.BAD_REQUEST,
            );
          }
        }

        // ── Execute use case ─────────────────────────────────────────────────
        const images = await this.replaceUseCase.execute(
          productId,
          req.session.storeId,
          useCaseSlots,
        );

        return ok(images);
      } catch (err) {
        return errorResponse(
          err instanceof AppError ? err : new AppError("Unexpected error."),
        );
      }
    },
  );
}
