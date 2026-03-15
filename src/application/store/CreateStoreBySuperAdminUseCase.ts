import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import type { IStoreRepository } from "@/domain/store/IStoreRepository";
import type { IPasswordHasher } from "@/application/ports/IPasswordHasher";
import type { StoreWithDetails } from "@/domain/store/types";
import { slugify } from "@/shared/utils/slugify";

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateStoreBySuperAdminInput {
  name: string;
  whatsapp: string;
  /** Optional: provide to pre-create a store admin account. */
  adminEmail?: string;
  /** Required when adminEmail is provided. */
  adminPassword?: string;
}

// ─── Use Case ─────────────────────────────────────────────────────────────────

/**
 * CreateStoreBySuperAdminUseCase — provisions a new store from the admin panel.
 *
 * Distinct from RegisterStoreUseCase (self-registration) to allow the super
 * admin to create stores without requiring all fields (e.g. no admin credentials
 * upfront for invite flows in the future).
 */
export class CreateStoreBySuperAdminUseCase {
  constructor(
    private readonly storeRepo: IStoreRepository,
    private readonly hasher: IPasswordHasher,
  ) {}

  async execute(
    input: CreateStoreBySuperAdminInput,
  ): Promise<StoreWithDetails> {
    const name = input.name.trim();
    if (!name || name.length < 2 || name.length > 100) {
      throw new AppError(
        "Store name must be between 2 and 100 characters.",
        HttpStatus.BAD_REQUEST,
      );
    }

    const whatsapp = input.whatsapp.trim().replace(/\D/g, "");
    if (whatsapp.length < 9 || whatsapp.length > 15) {
      throw new AppError(
        "WhatsApp must be between 9 and 15 digits.",
        HttpStatus.BAD_REQUEST,
      );
    }

    const slug = slugify(name);

    let passwordHash: string | undefined;
    if (input.adminEmail) {
      if (!input.adminPassword || input.adminPassword.length < 8) {
        throw new AppError(
          "Admin password must be at least 8 characters.",
          HttpStatus.BAD_REQUEST,
        );
      }
      passwordHash = await this.hasher.hash(input.adminPassword);
    }

    return this.storeRepo.createStore({
      name,
      slug,
      whatsapp,
      adminEmail: input.adminEmail?.trim().toLowerCase(),
      passwordHash,
    });
  }
}
