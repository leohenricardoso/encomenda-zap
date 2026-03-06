import type { IStoreRepository } from "@/domain/store/IStoreRepository";
import type { StorePickupAddress } from "@/domain/store/types";
import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";

export interface UpdatePickupAddressInput {
  locationName: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  complement: string | null;
  reference: string | null;
}

/**
 * UpdateStorePickupAddressUseCase — validates and persists the store's pickup address.
 *
 * Validation: the five core fields (locationName, street, number, neighborhood, city)
 * must be non-empty strings. Complement and reference are optional.
 */
export class UpdateStorePickupAddressUseCase {
  constructor(private readonly storeRepo: IStoreRepository) {}

  async execute(
    storeId: string,
    input: UpdatePickupAddressInput,
  ): Promise<void> {
    const required: Array<[string, string]> = [
      [input.locationName, "Nome do local"],
      [input.street, "Rua"],
      [input.number, "Número"],
      [input.neighborhood, "Bairro"],
      [input.city, "Cidade"],
    ];

    for (const [value, label] of required) {
      if (!value.trim()) {
        throw new AppError(
          `${label} é obrigatório.`,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
    }

    const address: StorePickupAddress = {
      locationName: input.locationName.trim(),
      street: input.street.trim(),
      number: input.number.trim(),
      neighborhood: input.neighborhood.trim(),
      city: input.city.trim(),
      complement: input.complement?.trim() || null,
      reference: input.reference?.trim() || null,
    };

    await this.storeRepo.updatePickupAddress(storeId, address);
  }
}
