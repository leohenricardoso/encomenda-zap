import type { IStoreRepository } from "@/domain/store/IStoreRepository";
import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";

/**
 * UpdateStoreWhatsappUseCase — validates and persists a new WhatsApp number.
 *
 * Validation rules (MVP):
 *  - Digits only (no spaces, dashes or parentheses)
 *  - 9–15 digits (ITU E.164 range, covers "55" country code + mobile number)
 *
 * The value is stored as-is (raw digit string, e.g. "5543999999999").
 */
export class UpdateStoreWhatsappUseCase {
  constructor(private readonly storeRepo: IStoreRepository) {}

  async execute(storeId: string, rawInput: string): Promise<void> {
    const digits = rawInput.replace(/\D/g, "");

    if (digits.length < 9 || digits.length > 15) {
      throw new AppError(
        "WhatsApp inválido. Informe apenas números com DDI (ex: 5543999999999).",
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    await this.storeRepo.updateWhatsapp(storeId, digits);
  }
}
