import { prisma } from "@/infra/prisma";
import type { IStorePickupSlotRepository } from "@/domain/pickupSlot/IStorePickupSlotRepository";
import type { StorePickupSlot } from "@/domain/pickupSlot/StorePickupSlot";

/**
 * PrismaPickupSlotRepository — concrete IStorePickupSlotRepository.
 *
 * All queries are scoped by storeId to enforce multi-tenancy.
 */
export class PrismaPickupSlotRepository implements IStorePickupSlotRepository {
  // ─── Mapping ──────────────────────────────────────────────────────────────

  private toEntity(raw: {
    id: string;
    storeId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): StorePickupSlot {
    return {
      id: raw.id,
      storeId: raw.storeId,
      dayOfWeek: raw.dayOfWeek,
      startTime: raw.startTime,
      endTime: raw.endTime,
      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  // ─── Queries ──────────────────────────────────────────────────────────────

  async findByStore(
    storeId: string,
    opts?: { dayOfWeek?: number; activeOnly?: boolean },
  ): Promise<StorePickupSlot[]> {
    const rows = await prisma.storePickupSlot.findMany({
      where: {
        storeId,
        ...(opts?.dayOfWeek !== undefined && { dayOfWeek: opts.dayOfWeek }),
        ...(opts?.activeOnly && { isActive: true }),
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return rows.map((r) => this.toEntity(r));
  }

  async findById(id: string, storeId: string): Promise<StorePickupSlot | null> {
    const row = await prisma.storePickupSlot.findFirst({
      where: { id, storeId },
    });

    return row ? this.toEntity(row) : null;
  }

  // ─── Mutations ─────────────────────────────────────────────────────────────

  async create(
    storeId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
  ): Promise<StorePickupSlot> {
    const row = await prisma.storePickupSlot.create({
      data: { storeId, dayOfWeek, startTime, endTime },
    });

    return this.toEntity(row);
  }

  async setActive(
    id: string,
    storeId: string,
    isActive: boolean,
  ): Promise<StorePickupSlot | null> {
    try {
      const row = await prisma.storePickupSlot.updateMany({
        where: { id, storeId },
        data: { isActive },
      });

      if (row.count === 0) return null;

      // Re-fetch the updated row to return the full entity
      return this.findById(id, storeId);
    } catch {
      return null;
    }
  }
}
