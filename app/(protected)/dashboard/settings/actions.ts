"use server";

import { getSession } from "@/infra/http/auth/getSession";
import {
  updateStoreWhatsappUseCase,
  updateStorePickupAddressUseCase,
} from "@/infra/composition";
import { AppError } from "@/shared/errors/AppError";
import type { UpdatePickupAddressInput } from "@/application/store/UpdateStorePickupAddressUseCase";

export type SaveWhatsappResult =
  | { success: true }
  | { success: false; error: string };

export async function saveWhatsapp(
  whatsapp: string,
): Promise<SaveWhatsappResult> {
  try {
    const session = await getSession();
    await updateStoreWhatsappUseCase.execute(session.storeId, whatsapp);
    return { success: true };
  } catch (err) {
    const message =
      err instanceof AppError
        ? err.message
        : "Não foi possível salvar. Tente novamente.";
    return { success: false, error: message };
  }
}

// ─── Pickup address ───────────────────────────────────────────────────────────

export type SavePickupAddressResult =
  | { success: true }
  | { success: false; error: string };

export async function savePickupAddress(
  input: UpdatePickupAddressInput,
): Promise<SavePickupAddressResult> {
  try {
    const session = await getSession();
    await updateStorePickupAddressUseCase.execute(session.storeId, input);
    return { success: true };
  } catch (err) {
    const message =
      err instanceof AppError
        ? err.message
        : "Não foi possível salvar. Tente novamente.";
    return { success: false, error: message };
  }
}
