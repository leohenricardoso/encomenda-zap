import type { ICustomerRepository } from "@/domain/customer/ICustomerRepository";
import type {
  CustomerWithStats,
  CustomerFilters,
} from "@/domain/customer/Customer";

/**
 * ListCustomersWithStatsUseCase
 *
 * Returns all customers for a store with aggregated order statistics.
 * Delegates filtering (search, minOrders, minTotalSpent) to the repository.
 *
 * Primary consumer: Customer listing dashboard page.
 */
export class ListCustomersWithStatsUseCase {
  constructor(private readonly repo: ICustomerRepository) {}

  async execute(
    storeId: string,
    filters?: CustomerFilters,
  ): Promise<CustomerWithStats[]> {
    return this.repo.findAllByStoreWithStats(storeId, filters);
  }
}
