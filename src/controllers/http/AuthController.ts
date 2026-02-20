import { NextRequest, NextResponse } from "next/server";
import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import { ok, created, withErrorHandler } from "@/shared/http";
import { signToken } from "@/infra/security/tokenService";
import {
  setAuthCookie,
  clearAuthCookie,
} from "@/infra/http/cookies/authCookie";
import type { LoginUseCase } from "@/application/auth/LoginUseCase";
import type { RegisterStoreUseCase } from "@/application/store/RegisterStoreUseCase";

// ─── Input size guards ────────────────────────────────────────────────────────

const MAX = {
  email: 254, // RFC 5321
  password: 128,
  storeName: 100,
  whatsapp: 20,
} as const;

// ─── Controller ───────────────────────────────────────────────────────────────

/**
 * AuthController — HTTP adapter for authentication operations.
 *
 * Responsibilities (and ONLY these):
 * 1. Parse and size-guard the raw request body
 * 2. Call the appropriate application use case
 * 3. Sign the JWT and attach it as an HttpOnly cookie (login)
 * 4. Map the use case result to a NextResponse
 *
 * NestJS migration:
 * - Decorate class with @Controller('auth')
 * - Inject use cases via constructor @Inject()
 * - Replace NextRequest/NextResponse with @Body(), @Res(), etc.
 * - Move cookie logic to an interceptor or @Res({ passthrough: true })
 */
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerStoreUseCase: RegisterStoreUseCase,
  ) {}

  // ─── POST /api/auth/login ───────────────────────────────────────────────────

  readonly login = withErrorHandler(
    async (req: unknown): Promise<NextResponse> => {
      const body = await this.parseJsonBody(req as NextRequest);

      const { email, password } = body;

      this.guardLength("email", email, MAX.email);
      this.guardLength("password", password, MAX.password);

      const { adminId, storeId } = await this.loginUseCase.execute({
        email: String(email ?? ""),
        password: String(password ?? ""),
      });

      const token = await signToken({ adminId, storeId });

      const response = ok({ adminId, storeId });
      setAuthCookie(response, token);

      return response;
    },
  );

  // ─── POST /api/auth/register ────────────────────────────────────────────────

  readonly register = withErrorHandler(
    async (req: unknown): Promise<NextResponse> => {
      const body = await this.parseJsonBody(req as NextRequest);

      const { storeName, storeWhatsapp, adminEmail, adminPassword } = body;

      this.guardLength("storeName", storeName, MAX.storeName);
      this.guardLength("storeWhatsapp", storeWhatsapp, MAX.whatsapp);
      this.guardLength("adminEmail", adminEmail, MAX.email);
      this.guardLength("adminPassword", adminPassword, MAX.password);

      const result = await this.registerStoreUseCase.execute({
        name: String(storeName ?? ""),
        whatsapp: String(storeWhatsapp ?? ""),
        adminEmail: String(adminEmail ?? ""),
        adminPassword: String(adminPassword ?? ""),
      });

      return created({ storeId: result.storeId, adminId: result.adminId });
    },
  );

  // ─── POST /api/auth/logout ──────────────────────────────────────────────────

  readonly logout = withErrorHandler(async (): Promise<NextResponse> => {
    const response = ok({ message: "Signed out." });
    clearAuthCookie(response);
    return response;
  });

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async parseJsonBody(
    req: NextRequest,
  ): Promise<Record<string, unknown>> {
    try {
      return (await req.json()) as Record<string, unknown>;
    } catch {
      throw new AppError("Invalid JSON body.", HttpStatus.BAD_REQUEST);
    }
  }

  private guardLength(field: string, value: unknown, max: number): void {
    if (typeof value === "string" && value.length > max) {
      throw new AppError(
        `${field} must be at most ${max} characters.`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
