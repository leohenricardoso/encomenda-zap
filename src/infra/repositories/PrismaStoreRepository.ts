import { Prisma } from "@prisma/client";
import { prisma } from "@/infra/prisma";
import type {
  IStoreRepository,
  CreateStoreWithAdminInput,
} from "@/domain/store/IStoreRepository";
import type { CreateStoreOutput } from "@/domain/store/types";
import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";

/**
 * PrismaStoreRepository
 *
 * Implements the domain's IStoreRepository contract using Prisma.
 *
 * Responsibility: translate infrastructure-level errors (e.g. Prisma P2002)
 * into domain AppErrors so upper layers remain decoupled from Prisma.
 *
 * NestJS migration:
 * - Decorate with @Injectable()
 * - Bind to IStoreRepository token in StoreModule providers
 */
export class PrismaStoreRepository implements IStoreRepository {
  /**
   * Atomically creates a Store and its first Admin inside a transaction.
   * Catches Prisma P2002 (unique constraint) and converts to AppError(CONFLICT).
   */
  async createWithAdmin(
    data: CreateStoreWithAdminInput,
  ): Promise<CreateStoreOutput> {
    try {
      return await prisma.$transaction(async (tx) => {
        const store = await tx.store.create({
          data: { name: data.name, whatsapp: data.whatsapp },
          select: { id: true },
        });

        const admin = await tx.admin.create({
          data: {
            email: data.adminEmail,
            passwordHash: data.passwordHash,
            storeId: store.id,
          },
          select: { id: true },
        });

        return { storeId: store.id, adminId: admin.id };
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new AppError(
          "An admin with this email already exists.",
          HttpStatus.CONFLICT,
        );
      }
      throw err;
    }
  }
}
