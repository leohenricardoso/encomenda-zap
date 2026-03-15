import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import type { IStoreRepository } from "@/domain/store/IStoreRepository";
import type { UpdateStoreInfoInput } from "@/domain/store/types";
import { slugify } from "@/shared/utils/slugify";

// ─── Use Case ─────────────────────────────────────────────────────────────────

/**
 * UpdateStoreInfoUseCase — updates editable store metadata from the admin panel.
 *
 * SUPER ADMIN ONLY.
 */
export class UpdateStoreInfoUseCase {
  constructor(private readonly storeRepo: IStoreRepository) {}

  async execute(id: string, input: UpdateStoreInfoInput): Promise<void> {
    const payload: UpdateStoreInfoInput = {};

    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name || name.length < 2 || name.length > 100) {
        throw new AppError(
          "Store name must be between 2 and 100 characters.",
          HttpStatus.BAD_REQUEST,
        );
      }
      payload.name = name;
    }

    if (input.slug !== undefined) {
      const slug = slugify(input.slug.trim());
      if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
        throw new AppError(
          "Slug must contain only lowercase letters, numbers, and hyphens.",
          HttpStatus.BAD_REQUEST,
        );
      }
      payload.slug = slug;
    }

    if (input.whatsapp !== undefined) {
      const whatsapp = input.whatsapp.trim().replace(/\D/g, "");
      if (whatsapp.length < 9 || whatsapp.length > 15) {
        throw new AppError(
          "WhatsApp must be between 9 and 15 digits.",
          HttpStatus.BAD_REQUEST,
        );
      }
      payload.whatsapp = whatsapp;
    }

    if (Object.keys(payload).length === 0) {
      throw new AppError("No fields to update.", HttpStatus.BAD_REQUEST);
    }

    await this.storeRepo.updateStoreInfo(id, payload);
  }
}
