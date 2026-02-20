import { HttpStatus } from "@/shared/http/statuses";

/**
 * Domain-level error that carries an HTTP status code.
 * Throw this in use-cases and catch it in API route handlers.
 *
 * @example
 * throw new AppError("Order not found", HttpStatus.NOT_FOUND);
 */
export class AppError extends Error {
  public readonly statusCode: HttpStatus;

  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;

    // Maintains proper prototype chain for `instanceof` checks
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /** Returns true if the error is a client-side (4xx) error. */
  isClientError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500;
  }
}
