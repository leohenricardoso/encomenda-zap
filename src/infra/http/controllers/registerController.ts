import { NextRequest } from "next/server";
import { createStore } from "@/domain/store/createStoreService";
import { created, errorResponse, withErrorHandler } from "@/shared/http";
import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";

// Input size limits (prevent oversized payloads before hitting the service)
const MAX_NAME_LENGTH = 100;
const MAX_WHATSAPP_LENGTH = 20;
const MAX_EMAIL_LENGTH = 254; // RFC 5321
const MAX_PASSWORD_LENGTH = 128;

/**
 * POST /api/auth/register
 * Parses and validates the raw request body, delegates to the domain service,
 * and returns a minimal response that never includes credentials.
 */
export const registerController = withErrorHandler(
  async (req: unknown): Promise<ReturnType<typeof created>> => {
    const request = req as NextRequest;

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      throw new AppError("Invalid JSON body.", HttpStatus.BAD_REQUEST);
    }

    const { storeName, storeWhatsapp, adminEmail, adminPassword } = body;

    // Size guards — checked before the service to surface clear messages
    if (typeof storeName === "string" && storeName.length > MAX_NAME_LENGTH) {
      throw new AppError(
        `Store name must be at most ${MAX_NAME_LENGTH} characters.`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      typeof storeWhatsapp === "string" &&
      storeWhatsapp.length > MAX_WHATSAPP_LENGTH
    ) {
      throw new AppError(
        `WhatsApp number must be at most ${MAX_WHATSAPP_LENGTH} characters.`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      typeof adminEmail === "string" &&
      adminEmail.length > MAX_EMAIL_LENGTH
    ) {
      throw new AppError(
        `Email must be at most ${MAX_EMAIL_LENGTH} characters.`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      typeof adminPassword === "string" &&
      adminPassword.length > MAX_PASSWORD_LENGTH
    ) {
      throw new AppError(
        `Password must be at most ${MAX_PASSWORD_LENGTH} characters.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await createStore({
      name: String(storeName ?? ""),
      whatsapp: String(storeWhatsapp ?? ""),
      adminEmail: String(adminEmail ?? ""),
      adminPassword: String(adminPassword ?? ""),
    });

    // Never include the admin password or hash in the response
    return created({
      storeId: result.storeId,
      adminId: result.adminId,
    });
  },
);
