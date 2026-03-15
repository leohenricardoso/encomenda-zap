import { prisma } from "@/infra/prisma";
import type { ISuperAdminRepository } from "@/domain/superAdmin/ISuperAdminRepository";
import type { SuperAdmin } from "@/domain/superAdmin/SuperAdmin";

/**
 * PrismaSuperAdminRepository
 *
 * Implements ISuperAdminRepository using Prisma.
 * Selects only fields needed for authentication — no over-fetching.
 */
export class PrismaSuperAdminRepository implements ISuperAdminRepository {
  async findByEmail(email: string): Promise<SuperAdmin | null> {
    const row = await prisma.superAdmin.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        name: true,
        isActive: true,
      },
    });
    return row ?? null;
  }

  async findById(id: string): Promise<SuperAdmin | null> {
    const row = await prisma.superAdmin.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        name: true,
        isActive: true,
      },
    });
    return row ?? null;
  }
}
