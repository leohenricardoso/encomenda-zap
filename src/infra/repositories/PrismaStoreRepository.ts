import { Prisma } from "@prisma/client";
import { prisma } from "@/infra/prisma";
import type {
  IStoreRepository,
  CreateStoreWithAdminInput,
  CreateStoreForAdminInput,
} from "@/domain/store/IStoreRepository";
import type {
  CreateStoreOutput,
  StorePickupAddress,
  StoreStatus,
  ListStoresFilter,
  UpdateStoreInfoInput,
  StoreWithDetails,
  PaginatedStores,
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

  async findIdentity(
    storeId: string,
  ): Promise<{ name: string; slug: string | null } | null> {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { name: true, slug: true },
    });
    return store ?? null;
  }

  async isSlugTaken(slug: string, excludeStoreId: string): Promise<boolean> {
    const count = await prisma.store.count({
      where: { slug, NOT: { id: excludeStoreId } },
    });
    return count > 0;
  }

  async updateIdentity(
    storeId: string,
    name: string,
    slug: string,
  ): Promise<void> {
    try {
      await prisma.store.update({
        where: { id: storeId },
        data: { name, slug },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new AppError(
          "Este slug já está em uso por outra loja.",
          HttpStatus.CONFLICT,
        );
      }
      throw err;
    }
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

  async findDefaultDeliveryFee(storeId: string): Promise<number> {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { defaultDeliveryFee: true },
    });
    return store ? Number(store.defaultDeliveryFee) : 0;
  }

  async updateDefaultDeliveryFee(storeId: string, fee: number): Promise<void> {
    await prisma.store.update({
      where: { id: storeId },
      data: { defaultDeliveryFee: fee },
    });
  }

  async findMinimumAdvanceDays(storeId: string): Promise<number> {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { minimumAdvanceDays: true },
    });
    return store?.minimumAdvanceDays ?? 1;
  }

  async updateMinimumAdvanceDays(storeId: string, days: number): Promise<void> {
    await prisma.store.update({
      where: { id: storeId },
      data: { minimumAdvanceDays: days },
    });
  }

  // ─── Super-admin-scoped methods ───────────────────────────────────────────────

  async listAll(filters: ListStoresFilter): Promise<PaginatedStores> {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Prisma.StoreWhereInput = {};
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.name = { contains: filters.search, mode: "insensitive" };
    }

    const [rows, total] = await Promise.all([
      prisma.store.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          whatsapp: true,
          status: true,
          isActive: true,
          createdAt: true,
          admin: { select: { email: true } },
        },
      }),
      prisma.store.count({ where }),
    ]);

    return {
      stores: rows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        whatsapp: r.whatsapp,
        status: r.status as StoreStatus,
        isActive: r.isActive,
        createdAt: r.createdAt,
        adminEmail: r.admin?.email ?? null,
      })),
      total,
      page,
      limit,
    };
  }

  async findStoreById(id: string): Promise<StoreWithDetails | null> {
    const row = await prisma.store.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        whatsapp: true,
        status: true,
        isActive: true,
        createdAt: true,
        admin: { select: { email: true } },
      },
    });
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      whatsapp: row.whatsapp,
      status: row.status as StoreStatus,
      isActive: row.isActive,
      createdAt: row.createdAt,
      adminEmail: row.admin?.email ?? null,
    };
  }

  async createStore(
    input: CreateStoreForAdminInput,
  ): Promise<StoreWithDetails> {
    try {
      return await prisma.$transaction(async (tx) => {
        const store = await tx.store.create({
          data: {
            name: input.name,
            slug: input.slug,
            whatsapp: input.whatsapp,
          },
          select: {
            id: true,
            name: true,
            slug: true,
            whatsapp: true,
            status: true,
            isActive: true,
            createdAt: true,
          },
        });

        let adminEmail: string | null = null;
        if (input.adminEmail && input.passwordHash) {
          await tx.admin.create({
            data: {
              email: input.adminEmail,
              passwordHash: input.passwordHash,
              storeId: store.id,
            },
          });
          adminEmail = input.adminEmail;
        }

        return {
          ...store,
          status: store.status as StoreStatus,
          adminEmail,
        };
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new AppError(
          "A store or admin with those details already exists.",
          HttpStatus.CONFLICT,
        );
      }
      throw err;
    }
  }

  async updateStoreInfo(
    id: string,
    input: UpdateStoreInfoInput,
  ): Promise<void> {
    const data: Prisma.StoreUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.slug !== undefined) data.slug = input.slug;
    if (input.whatsapp !== undefined) data.whatsapp = input.whatsapp;

    await prisma.store.update({ where: { id }, data });
  }

  async updateStoreStatus(id: string, status: StoreStatus): Promise<void> {
    await prisma.store.update({
      where: { id },
      data: {
        status,
        // Keep isActive in sync for backward compatibility with catalog queries
        isActive: status === "ACTIVE",
      },
    });
  }
}
