import { NextResponse } from "next/server";
import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";

// ─── Response shapes ─────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    code?: string;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns a 200 OK (or custom status) response with a typed data payload.
 *
 * @example
 * return ok({ id: order.id });
 */
export function ok<T>(data: T, status = HttpStatus.OK) {
  const body: ApiSuccess<T> = { success: true, data };
  return NextResponse.json(body, { status });
}

/**
 * Returns a 201 Created response.
 */
export function created<T>(data: T) {
  return ok(data, HttpStatus.CREATED);
}

/**
 * Returns a 204 No Content response.
 */
export function noContent() {
  return new NextResponse(null, { status: HttpStatus.NO_CONTENT });
}

/**
 * Returns an error response.
 * Automatically extracts status code from AppError instances.
 *
 * @example
 * return errorResponse(new AppError("Not found", HttpStatus.NOT_FOUND));
 * return errorResponse("Unexpected error");
 */
export function errorResponse(
  err: AppError | Error | string,
  fallbackStatus = HttpStatus.INTERNAL_SERVER_ERROR
) {
  const message = typeof err === "string" ? err : err.message;
  const status = err instanceof AppError ? err.statusCode : fallbackStatus;

  const body: ApiError = {
    success: false,
    error: { message },
  };

  return NextResponse.json(body, { status });
}

/**
 * Wraps an API route handler with automatic AppError handling.
 * Any unhandled error becomes a 500 or the AppError's own status code.
 *
 * @example
 * export const GET = withErrorHandler(async (req) => {
 *   const orders = await listOrders();
 *   return ok(orders);
 * });
 */
export function withErrorHandler(
  handler: (...args: unknown[]) => Promise<NextResponse>
) {
  return async (...args: unknown[]): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof AppError) {
        return errorResponse(err);
      }

      // Unexpected errors — do not leak internal details in production
      const message =
        process.env.NODE_ENV === "development" && err instanceof Error
          ? err.message
          : "An unexpected error occurred";

      return errorResponse(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  };
}
