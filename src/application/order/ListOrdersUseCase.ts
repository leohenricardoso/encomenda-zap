import type { IOrderRepository } from "@/domain/order/IOrderRepository";
import type { OrderWithDetails, OrderFilters } from "@/domain/order/Order";
import { OrderStatus } from "@/domain/order/Order";

/**
 * ListOrdersUseCase
 *
 * Returns all orders with joined customer + items for a store.
 * Primary consumer: admin dashboard / agenda view.
 *
 * Filters are forwarded verbatim so call-sites can narrow by date range,
 * status, etc. without coupling the use case to dashboard-specific concerns.
 */
export class ListOrdersUseCase {
  constructor(private readonly repo: IOrderRepository) {}

  async execute(
    storeId: string,
    filters?: OrderFilters,
  ): Promise<OrderWithDetails[]> {
    const effectiveFilters: OrderFilters = {
      ...filters,
      status:
        filters?.status !== undefined
          ? filters.status
          : [OrderStatus.PENDING, OrderStatus.APPROVED],
    };
    return this.repo.findAllByStoreWithDetails(storeId, effectiveFilters);
  }
}
