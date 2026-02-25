import { prisma } from "@/infra/prisma";
import type { IStoreCepRangeRepository } from "@/domain/cepRange/IStoreCepRangeRepository";
import type { StoreCepRange } from "@/domain/cepRange/StoreCepRange";

/**
 * PrismaCepRangeRepository — concrete IStoreCepRangeRepository.
 *
 * All queries are scoped by storeId to enforce multi-tenancy.
 */
export class PrismaCepRangeRepository implements IStoreCepRangeRepository {
  // ─── Mapping ──────────────────────────────────────────────────────────────

  private toEntity(raw: {
    id: string;
    storeId: string;
    cepStart: string;
    cepEnd: string;
    createdAt: Date;
    updatedAt: Date;
  }): StoreCepRange {
    return {
      id: raw.id,
      storeId: raw.storeId,
      cepStart: raw.cepStart,
      cepEnd: raw.cepEnd,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  // ─── Queries ──────────────────────────────────────────────────────────────

  async findByStore(storeId: string): Promise<StoreCepRange[]> {
    const rows = await prisma.storeCepRange.findMany({
      where: { storeId },
      orderBy: { cepStart: "asc" },
    });
    return rows.map((r) => this.toEntity(r));
  }

  // ─── Mutations ─────────────────────────────────────────────────────────────

  async create(
    storeId: string,
    cepStart: string,
    cepEnd: string,
  ): Promise<StoreCepRange> {
    const row = await prisma.storeCepRange.create({
      data: { storeId, cepStart, cepEnd },
    });
    return this.toEntity(row);
  }

  async deleteById(id: string, storeId: string): Promise<void> {
    // Scoped by storeId — silently no-ops if the row doesn't exist or
    // belongs to a different store (tenant safety).
    await prisma.storeCepRange.deleteMany({ where: { id, storeId } });
  }
}
