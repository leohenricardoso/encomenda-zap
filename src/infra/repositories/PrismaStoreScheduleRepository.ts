import { prisma } from "@/infra/prisma";
import type { IStoreScheduleRepository } from "@/domain/schedule/IStoreScheduleRepository";
import type { StoreSchedule } from "@/domain/schedule/StoreSchedule";

/**
 * PrismaStoreScheduleRepository — concrete IStoreScheduleRepository.
 *
 * Only stores explicit date overrides (exceptions to the Mon–Fri default).
 * The application layer is responsible for merging defaults with overrides.
 *
 * @@unique([storeId, date]) in the schema enables a clean upsert with
 * Prisma's `upsert` operation using the composite key.
 */
export class PrismaStoreScheduleRepository implements IStoreScheduleRepository {
  // ─── Mapping ──────────────────────────────────────────────────────────────

  private toEntity(raw: {
    id: string;
    storeId: string;
    date: string;
    isOpen: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): StoreSchedule {
    return {
      id: raw.id,
      storeId: raw.storeId,
      date: raw.date,
      isOpen: raw.isOpen,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  // ─── Queries ──────────────────────────────────────────────────────────────

  async findByDateRange(
    storeId: string,
    from: string,
    to: string,
  ): Promise<StoreSchedule[]> {
    const rows = await prisma.storeSchedule.findMany({
      where: {
        storeId,
        date: { gte: from, lte: to },
      },
      orderBy: { date: "asc" },
    });

    return rows.map((r) => this.toEntity(r));
  }

  async findByDate(
    storeId: string,
    date: string,
  ): Promise<StoreSchedule | null> {
    const row = await prisma.storeSchedule.findUnique({
      where: { storeId_date: { storeId, date } },
    });

    return row ? this.toEntity(row) : null;
  }

  // ─── Mutations ─────────────────────────────────────────────────────────────

  async upsert(
    storeId: string,
    date: string,
    isOpen: boolean,
  ): Promise<StoreSchedule> {
    const row = await prisma.storeSchedule.upsert({
      where: { storeId_date: { storeId, date } },
      create: { storeId, date, isOpen },
      update: { isOpen },
    });

    return this.toEntity(row);
  }
}
