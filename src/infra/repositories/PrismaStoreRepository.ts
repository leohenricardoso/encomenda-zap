import { Prisma } from "@prisma/client";
import { prisma } from "@/infra/prisma";
import type {
  IStoreRepository,
  CreateStoreWithAdminInput,
} from "@/domain/store/IStoreRepository";
import type {
  CreateStoreOutput,
  StorePickupAddress,
} from "@/domain/store/types";
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
          data: { name: data.name, slug: data.slug, whatsapp: data.whatsapp },
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

  async findById(storeId: string): Promise<{ whatsapp: string } | null> {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { whatsapp: true },
    });
    return store ?? null;
  }

  async updateWhatsapp(storeId: string, whatsapp: string): Promise<void> {
    await prisma.store.update({
      where: { id: storeId },
      data: { whatsapp },
    });
  }

  async findPickupAddress(storeId: string): Promise<StorePickupAddress | null> {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        pickupLocationName: true,
        pickupStreet: true,
        pickupNumber: true,
        pickupNeighborhood: true,
        pickupCity: true,
        pickupComplement: true,
        pickupReference: true,
      },
    });
    if (
      !store ||
      !store.pickupLocationName ||
      !store.pickupStreet ||
      !store.pickupNumber ||
      !store.pickupNeighborhood ||
      !store.pickupCity
    )
      return null;
    return {
      locationName: store.pickupLocationName,
      street: store.pickupStreet,
      number: store.pickupNumber,
      neighborhood: store.pickupNeighborhood,
      city: store.pickupCity,
      complement: store.pickupComplement,
      reference: store.pickupReference,
    };
  }

  async updatePickupAddress(
    storeId: string,
    address: StorePickupAddress,
  ): Promise<void> {
    await prisma.store.update({
      where: { id: storeId },
      data: {
        pickupLocationName: address.locationName,
        pickupStreet: address.street,
        pickupNumber: address.number,
        pickupNeighborhood: address.neighborhood,
        pickupCity: address.city,
        pickupComplement: address.complement,
        pickupReference: address.reference,
      },
    });
  }
}
