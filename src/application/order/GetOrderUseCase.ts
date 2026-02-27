import type { IOrderRepository } from "@/domain/order/IOrderRepository";
import type { OrderWithDetails } from "@/domain/order/Order";

/**
 * GetOrderUseCase
 *
 * Fetches a single order with full customer info and line items.
 * Primary consumer: admin order detail page.
 * Always tenant-scoped — storeId from session, never from URL params.
 */
export class GetOrderUseCase {
  constructor(private readonly repo: IOrderRepository) {}

  async execute(id: string, storeId: string): Promise<OrderWithDetails | null> {
    return this.repo.findByIdWithDetails(id, storeId);
  }
}
