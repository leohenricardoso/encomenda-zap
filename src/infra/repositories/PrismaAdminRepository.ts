import { prisma } from "@/infra/prisma";
import type { IAdminRepository } from "@/domain/auth/IAdminRepository";
import type { Admin } from "@/domain/auth/Admin";

/**
 * PrismaAdminRepository
 *
 * Implements the domain's IAdminRepository contract using Prisma.
 * Only exposes fields needed for authentication.
 *
 * NestJS migration:
 * - Decorate with @Injectable()
 * - Bind to IAdminRepository token in AuthModule providers
 */
export class PrismaAdminRepository implements IAdminRepository {
  async findByEmail(email: string): Promise<Admin | null> {
    const row = await prisma.admin.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        storeId: true,
        store: { select: { status: true } },
      },
    });

    if (!row) return null;

    return {
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      storeId: row.storeId,
      storeStatus: row.store.status,
    };
  }
}
