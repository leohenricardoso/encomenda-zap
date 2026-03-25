import { prisma } from "@/infra/prisma/client";
import type { IDailyProductionChecklistRepository } from "@/domain/production/IDailyProductionChecklistRepository";

/**
 * PrismaDailyProductionChecklistRepository
 *
 * Concrete implementation of IDailyProductionChecklistRepository backed by
 * the `daily_production_checklist_items` PostgreSQL table.
 *
 * Toggle strategy:
 * 1. Try to CREATE the row.
 * 2. If Prisma throws a unique-constraint error (P2002), the item was already
 *    marked → DELETE it and return false.
 * 3. On successful create, return true.
 *
 * This avoids a read-then-write race condition.
 */
export class PrismaDailyProductionChecklistRepository implements IDailyProductionChecklistRepository {
  async getProducedKeys(storeId: string, date: string): Promise<Set<string>> {
    const rows = await prisma.dailyProductionChecklistItem.findMany({
      where: { storeId, date },
      select: { itemKey: true },
    });
    return new Set(rows.map((r) => r.itemKey));
  }

  async toggleItem(
    storeId: string,
    date: string,
    itemKey: string,
  ): Promise<boolean> {
    try {
      await prisma.dailyProductionChecklistItem.create({
        data: { storeId, date, itemKey },
      });
      return true;
    } catch (err: unknown) {
      // Prisma unique constraint violation → item was already produced → delete
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: string }).code === "P2002"
      ) {
        await prisma.dailyProductionChecklistItem.deleteMany({
          where: { storeId, date, itemKey },
        });
        return false;
      }
      throw err;
    }
  }
}
