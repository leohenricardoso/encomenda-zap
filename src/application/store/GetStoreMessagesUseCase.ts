import type { IStoreMessageRepository } from "@/domain/store/IStoreMessageRepository";
import type { StoreMessageConfig } from "@/domain/store/StoreMessageConfig";

export class GetStoreMessagesUseCase {
  constructor(private readonly repo: IStoreMessageRepository) {}

  async execute(storeId: string): Promise<StoreMessageConfig | null> {
    return this.repo.findByStore(storeId);
  }
}
