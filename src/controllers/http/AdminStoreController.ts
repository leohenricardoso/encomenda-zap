import { NextResponse } from "next/server";
import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import { ok, created, errorResponse } from "@/shared/http";
import {
  withSuperAdminAuth,
  type SuperAdminRequest,
} from "@/infra/http/middleware/withSuperAdminAuth";
import type { ListAllStoresUseCase } from "@/application/store/ListAllStoresUseCase";
import type { GetStoreDetailUseCase } from "@/application/store/GetStoreDetailUseCase";
import type { CreateStoreBySuperAdminUseCase } from "@/application/store/CreateStoreBySuperAdminUseCase";
import type { UpdateStoreInfoUseCase } from "@/application/store/UpdateStoreInfoUseCase";
import type { SetStoreStatusUseCase } from "@/application/store/SetStoreStatusUseCase";
import type { StoreStatus } from "@/domain/store/types";

const MAX = {
  name: 100,
  slug: 100,
  whatsapp: 20,
  email: 254,
  password: 128,
} as const;

/**
 * AdminStoreController — HTTP adapter for super-admin store management.
 *
 * All methods are wrapped with withSuperAdminAuth, so only requests bearing
 * a valid sa_token can reach the use cases.
 */
export class AdminStoreController {
  constructor(
    private readonly listAllStoresUseCase: ListAllStoresUseCase,
    private readonly getStoreDetailUseCase: GetStoreDetailUseCase,
    private readonly createStoreBySuperAdminUseCase: CreateStoreBySuperAdminUseCase,
    private readonly updateStoreInfoUseCase: UpdateStoreInfoUseCase,
    private readonly setStoreStatusUseCase: SetStoreStatusUseCase,
  ) {}

  // ─── GET /api/admin/stores ─────────────────────────────────────────────────

  readonly list = withSuperAdminAuth(
    async (req: SuperAdminRequest): Promise<NextResponse> => {
      try {
        const { searchParams } = new URL(req.url);
        const result = await this.listAllStoresUseCase.execute({
          status: (searchParams.get("status") as StoreStatus) ?? undefined,
          search: searchParams.get("search") ?? undefined,
          page: searchParams.get("page")
            ? parseInt(searchParams.get("page")!, 10)
            : undefined,
          limit: searchParams.get("limit")
            ? parseInt(searchParams.get("limit")!, 10)
            : undefined,
        });
        return ok(result);
      } catch (err) {
        return errorResponse(
          err instanceof AppError ? err : new AppError("Unexpected error."),
        );
      }
    },
  );

  // ─── POST /api/admin/stores ────────────────────────────────────────────────

  readonly create = withSuperAdminAuth(
    async (req: SuperAdminRequest): Promise<NextResponse> => {
      try {
        const body = await this.parseJsonBody(req);
        const { name, whatsapp, adminEmail, adminPassword } = body;

        this.guardLength("name", name, MAX.name);
        this.guardLength("whatsapp", whatsapp, MAX.whatsapp);
        if (adminEmail !== undefined)
          this.guardLength("adminEmail", adminEmail, MAX.email);
        if (adminPassword !== undefined)
          this.guardLength("adminPassword", adminPassword, MAX.password);

        const store = await this.createStoreBySuperAdminUseCase.execute({
          name: String(name ?? ""),
          whatsapp: String(whatsapp ?? ""),
          adminEmail: adminEmail ? String(adminEmail) : undefined,
          adminPassword: adminPassword ? String(adminPassword) : undefined,
        });
        return created(store);
      } catch (err) {
        return errorResponse(
          err instanceof AppError ? err : new AppError("Unexpected error."),
        );
      }
    },
  );

  // ─── GET /api/admin/stores/[id] ────────────────────────────────────────────

  readonly getById = withSuperAdminAuth(
    async (
      req: SuperAdminRequest,
      ...args: unknown[]
    ): Promise<NextResponse> => {
      try {
        const id = await this.extractId(args);
        const store = await this.getStoreDetailUseCase.execute(id);
        return ok(store);
      } catch (err) {
        return errorResponse(
          err instanceof AppError ? err : new AppError("Unexpected error."),
        );
      }
    },
  );

  // ─── PATCH /api/admin/stores/[id] ─────────────────────────────────────────

  readonly update = withSuperAdminAuth(
    async (
      req: SuperAdminRequest,
      ...args: unknown[]
    ): Promise<NextResponse> => {
      try {
        const id = await this.extractId(args);
        const body = await this.parseJsonBody(req);
        const { name, slug, whatsapp } = body;

        if (name !== undefined) this.guardLength("name", name, MAX.name);
        if (slug !== undefined) this.guardLength("slug", slug, MAX.slug);
        if (whatsapp !== undefined)
          this.guardLength("whatsapp", whatsapp, MAX.whatsapp);

        await this.updateStoreInfoUseCase.execute(id, {
          name: name !== undefined ? String(name) : undefined,
          slug: slug !== undefined ? String(slug) : undefined,
          whatsapp: whatsapp !== undefined ? String(whatsapp) : undefined,
        });
        return ok({ updated: true });
      } catch (err) {
        return errorResponse(
          err instanceof AppError ? err : new AppError("Unexpected error."),
        );
      }
    },
  );

  // ─── POST /api/admin/stores/[id]/status ───────────────────────────────────

  readonly setStatus = withSuperAdminAuth(
    async (
      req: SuperAdminRequest,
      ...args: unknown[]
    ): Promise<NextResponse> => {
      try {
        const id = await this.extractId(args);
        const body = await this.parseJsonBody(req);
        const { status } = body;

        if (!status || typeof status !== "string") {
          throw new AppError("status is required.", HttpStatus.BAD_REQUEST);
        }

        await this.setStoreStatusUseCase.execute(id, status);
        return ok({ updated: true });
      } catch (err) {
        return errorResponse(
          err instanceof AppError ? err : new AppError("Unexpected error."),
        );
      }
    },
  );

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async parseJsonBody(
    req: SuperAdminRequest,
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

  private async extractId(args: unknown[]): Promise<string> {
    const ctx = (args[0] ?? {}) as { params: Promise<{ id: string }> };
    const { id } = await ctx.params;
    if (!id) {
      throw new AppError("Missing store ID.", HttpStatus.BAD_REQUEST);
    }
    return id;
  }
}
