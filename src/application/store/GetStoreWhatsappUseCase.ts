import type { IStoreRepository } from "@/domain/store/IStoreRepository";

/**
 * GetStoreWhatsappUseCase — returns the current WhatsApp number for a store.
 *
 * Returns the raw digit string (e.g. "5543999999999") or null when the
 * store doesn't exist. The caller (settings page) is responsible for deciding
 * how to display it.
 */
export class GetStoreWhatsappUseCase {
  constructor(private readonly storeRepo: IStoreRepository) {}

  async execute(storeId: string): Promise<string | null> {
    const store = await this.storeRepo.findById(storeId);
    return store?.whatsapp ?? null;
  }
}
