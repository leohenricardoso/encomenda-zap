import { prisma } from "@/infra/prisma";
import type { IStoreMessageRepository } from "@/domain/store/IStoreMessageRepository";
import type { StoreMessageConfig } from "@/domain/store/StoreMessageConfig";

export class PrismaStoreMessageRepository implements IStoreMessageRepository {
  private toEntity(raw: {
    storeId: string;
    approvalMessage: string | null;
    rejectionMessage: string | null;
  }): StoreMessageConfig {
    return {
      storeId: raw.storeId,
      approvalMessage: raw.approvalMessage,
      rejectionMessage: raw.rejectionMessage,
    };
  }

  async findByStore(storeId: string): Promise<StoreMessageConfig | null> {
    const row = await prisma.storeMessageConfig.findUnique({
      where: { storeId },
    });
    return row ? this.toEntity(row) : null;
  }

  async upsert(config: StoreMessageConfig): Promise<StoreMessageConfig> {
    const row = await prisma.storeMessageConfig.upsert({
      where: { storeId: config.storeId },
      create: {
        storeId: config.storeId,
        approvalMessage: config.approvalMessage,
        rejectionMessage: config.rejectionMessage,
      },
      update: {
        approvalMessage: config.approvalMessage,
        rejectionMessage: config.rejectionMessage,
      },
    });
    return this.toEntity(row);
  }
}
