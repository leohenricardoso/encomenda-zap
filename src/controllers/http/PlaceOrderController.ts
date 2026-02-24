import { NextRequest, NextResponse } from "next/server";
import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import { created, errorResponse } from "@/shared/http";
import type { PlaceOrderService } from "@/application/order/PlaceOrderService";

/**
 * PlaceOrderController — HTTP adapter for the public order-creation endpoint.
 *
 * Responsibilities (and ONLY these):
 * 1. Parse and coerce the raw JSON body into typed inputs.
 * 2. Call PlaceOrderService with the validated inputs.
 * 3. Map the service result to a NextResponse (201 Created or error).
 *
 * No business rules live here.  Validation that requires domain knowledge
 * (product active, quantity >= min, future date, etc.) is in the service.
 * This layer only handles structural concerns: missing fields, wrong types.
 *
 * Authentication: none — order creation is public.
 */
export class PlaceOrderController {
  constructor(private readonly service: PlaceOrderService) {}

  readonly placeOrder = async (req: NextRequest): Promise<NextResponse> => {
    // ── 1. Parse body ──────────────────────────────────────────────────────

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return errorResponse(
        new AppError("Invalid JSON body.", HttpStatus.BAD_REQUEST),
      );
    }

    // ── 2. Extract and coerce fields ───────────────────────────────────────

    const { storeSlug, customer, items, shippingAddress, deliveryDate } = body;

    // Structural guard: customer must be an object
    if (
      typeof customer !== "object" ||
      customer === null ||
      Array.isArray(customer)
    ) {
      return errorResponse(
        new AppError(
          "customer must be an object with name and whatsapp.",
          HttpStatus.BAD_REQUEST,
        ),
      );
    }
    const customerObj = customer as Record<string, unknown>;

    // Structural guard: items must be a non-empty array
    if (!Array.isArray(items)) {
      return errorResponse(
        new AppError("items must be an array.", HttpStatus.BAD_REQUEST),
      );
    }

    // Parse deliveryDate — accepts ISO 8601 string or ms timestamp
    let parsedDeliveryDate: Date;
    try {
      parsedDeliveryDate = new Date(deliveryDate as string);
      if (isNaN(parsedDeliveryDate.getTime())) throw new Error();
    } catch {
      return errorResponse(
        new AppError(
          "deliveryDate must be a valid ISO 8601 date string.",
          HttpStatus.BAD_REQUEST,
        ),
      );
    }

    // ── 3. Call service ────────────────────────────────────────────────────

    try {
      const result = await this.service.execute({
        storeSlug: String(storeSlug ?? ""),
        customer: {
          name: String(customerObj.name ?? ""),
          whatsapp: String(customerObj.whatsapp ?? ""),
        },
        items: items.map((item: unknown) => {
          const i = item as Record<string, unknown>;
          return {
            productId: String(i.productId ?? ""),
            variantId: i.variantId != null ? String(i.variantId) : null,
            quantity: Number(i.quantity),
          };
        }),
        shippingAddress:
          typeof shippingAddress === "string" ? shippingAddress : null,
        deliveryDate: parsedDeliveryDate,
      });

      return created(result);
    } catch (err) {
      return errorResponse(
        err instanceof AppError ? err : new AppError("Unexpected error."),
      );
    }
  };
}
