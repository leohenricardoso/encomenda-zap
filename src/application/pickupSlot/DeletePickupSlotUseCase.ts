import type { IStorePickupSlotRepository } from "@/domain/pickupSlot/IStorePickupSlotRepository";
import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";

export class DeletePickupSlotUseCase {
  constructor(private readonly repo: IStorePickupSlotRepository) {}

  async execute(id: string, storeId: string): Promise<void> {
    const deleted = await this.repo.delete(id, storeId);
    if (!deleted) {
      throw new AppError("Pickup slot not found.", HttpStatus.NOT_FOUND);
    }
  }
}
