import type { IStoreMessageRepository } from "@/domain/store/IStoreMessageRepository";
import type { StoreMessageConfig } from "@/domain/store/StoreMessageConfig";
import { MESSAGE_MAX_LENGTH } from "@/domain/store/StoreMessageConfig";

function sanitize(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const stripped = value.replace(/<[^>]*>/g, "").trim();
  if (stripped.length === 0) return null;
  return stripped.slice(0, MESSAGE_MAX_LENGTH);
}

export class UpsertStoreMessagesUseCase {
  constructor(private readonly repo: IStoreMessageRepository) {}

  async execute(
    storeId: string,
    approvalMessage: string | null | undefined,
    rejectionMessage: string | null | undefined,
  ): Promise<StoreMessageConfig> {
    const config: StoreMessageConfig = {
      storeId,
      approvalMessage: sanitize(approvalMessage),
      rejectionMessage: sanitize(rejectionMessage),
    };
    return this.repo.upsert(config);
  }
}
