import { NextRequest, NextResponse } from "next/server";
import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import { ok, withErrorHandler } from "@/shared/http";
import { signSuperAdminToken } from "@/infra/security/superAdminTokenService";
import {
  setSuperAdminCookie,
  clearSuperAdminCookie,
} from "@/infra/http/cookies/superAdminCookie";
import type { LoginSuperAdminUseCase } from "@/application/superAdmin/LoginSuperAdminUseCase";

const MAX = {
  email: 254,
  password: 128,
} as const;

/**
 * SuperAdminAuthController — HTTP adapter for super-admin authentication.
 *
 * Deliberately separate from AuthController so store-admin auth logic
 * and super-admin auth logic never share code paths.
 */
export class SuperAdminAuthController {
  constructor(
    private readonly loginSuperAdminUseCase: LoginSuperAdminUseCase,
  ) {}

  // ─── POST /api/admin/auth/login ────────────────────────────────────────────

  readonly login = withErrorHandler(
    async (req: unknown): Promise<NextResponse> => {
      const body = await this.parseJsonBody(req as NextRequest);
      const { email, password } = body;

      this.guardLength("email", email, MAX.email);
      this.guardLength("password", password, MAX.password);

      const { superAdminId } = await this.loginSuperAdminUseCase.execute({
        email: String(email ?? ""),
        password: String(password ?? ""),
      });

      const token = await signSuperAdminToken({
        superAdminId,
        role: "SUPER_ADMIN",
      });

      const response = ok({ superAdminId });
      setSuperAdminCookie(response, token);
      return response;
    },
  );

  // ─── POST /api/admin/auth/logout ───────────────────────────────────────────

  readonly logout = withErrorHandler(async (): Promise<NextResponse> => {
    const response = ok({ message: "Signed out." });
    clearSuperAdminCookie(response);
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
