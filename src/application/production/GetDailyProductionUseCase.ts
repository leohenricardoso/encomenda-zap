import type { IOrderRepository } from "@/domain/order/IOrderRepository";
import { OrderStatus } from "@/domain/order/Order";
import type { IDailyProductionChecklistRepository } from "@/domain/production/IDailyProductionChecklistRepository";
import type {
  DailyProductionGroup,
  DailyProductionItem,
  DailyProductionOrderRef,
} from "@/domain/production/DailyProduction";

// ─── Input ────────────────────────────────────────────────────────────────────

export interface GetDailyProductionInput {
  storeId: string;
  /**
   * Calendar date in YYYY-MM-DD format (e.g. "2026-03-23").
   * The use case converts this to a full-day UTC datetime range for the query.
   */
  date: string;
  /**
   * When true, PENDING orders are included alongside APPROVED orders.
   * REJECTED orders are never included.
   * Defaults to false (APPROVED only).
   */
  includesPending?: boolean;
}

// ─── Use case ─────────────────────────────────────────────────────────────────

/**
 * GetDailyProductionUseCase
 *
 * Aggregates all order items for a given date into a category → product →
 * variant grouped view suitable for production planning.
 *
 * Algorithm:
 * 1. Build a full-day UTC range from the input date string.
 * 2. Query orders via findAllByStoreWithDetails with date + status filters.
 * 3. Fetch already-produced checklist keys in parallel.
 * 4. Flatten all items across orders; group by primary category.
 * 5. Within each category, group items by productId+variantId; accumulate
 *    quantities and collect order references.
 * 6. Sort: groups alphabetically; items by totalQuantity descending.
 */
export class GetDailyProductionUseCase {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly checklistRepo: IDailyProductionChecklistRepository,
  ) {}

  async execute(
    input: GetDailyProductionInput,
  ): Promise<DailyProductionGroup[]> {
    const { storeId, date, includesPending = false } = input;

    // ── 1. Build full-day UTC range ────────────────────────────────────────
    const deliveryDateFrom = new Date(`${date}T00:00:00.000Z`);
    const deliveryDateTo = new Date(`${date}T23:59:59.999Z`);

    const statuses = includesPending
      ? [OrderStatus.APPROVED, OrderStatus.PENDING]
      : [OrderStatus.APPROVED];

    // ── 2+3. Fetch orders and checklist keys in parallel ───────────────────
    const [orders, producedKeys] = await Promise.all([
      this.orderRepo.findAllByStoreWithDetails(storeId, {
        deliveryDateFrom,
        deliveryDateTo,
        status: statuses,
      }),
      this.checklistRepo.getProducedKeys(storeId, date),
    ]);

    // ── 4+5. Group items ───────────────────────────────────────────────────
    // Map: categoryName → itemKey → accumulated DailyProductionItem
    const categoryMap = new Map<string, Map<string, DailyProductionItem>>();

    for (const order of orders) {
      for (const item of order.items) {
        const categoryName = item.categoryNames[0] ?? "Sem categoria";
        const itemKey = `${item.productId}::${item.variantId ?? "no-variant"}`;

        if (!categoryMap.has(categoryName)) {
          categoryMap.set(categoryName, new Map());
        }
        const itemsInCategory = categoryMap.get(categoryName)!;

        const orderRef: DailyProductionOrderRef = {
          orderId: order.id,
          incrementId: order.orderNumber,
          customerName: order.customerName,
          quantity: item.quantity,
          deliveryTime: order.pickupTime,
        };

        if (itemsInCategory.has(itemKey)) {
          const existing = itemsInCategory.get(itemKey)!;
          existing.totalQuantity += item.quantity;
          existing.orders.push(orderRef);
        } else {
          itemsInCategory.set(itemKey, {
            itemKey,
            productName: item.productName,
            variationLabel: item.variantLabel,
            totalQuantity: item.quantity,
            produced: producedKeys.has(itemKey),
            orders: [orderRef],
          });
        }
      }
    }

    // ── 6. Build sorted output ─────────────────────────────────────────────
    const groups: DailyProductionGroup[] = Array.from(categoryMap.entries())
      .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
      .map(([categoryName, itemsMap]) => ({
        categoryName,
        items: Array.from(itemsMap.values())
          .sort((a, b) => b.totalQuantity - a.totalQuantity)
          .map((prodItem) => ({
            ...prodItem,
            orders: prodItem.orders.sort((a, b) => {
              if (a.deliveryTime && b.deliveryTime) {
                return a.deliveryTime.localeCompare(b.deliveryTime);
              }
              return (a.incrementId ?? 0) - (b.incrementId ?? 0);
            }),
          })),
      }));

    return groups;
  }
}
