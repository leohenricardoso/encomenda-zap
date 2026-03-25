"use server";

import { getSession } from "@/infra/http/auth/getSession";
import {
  updateStoreWhatsappUseCase,
  updateStorePickupAddressUseCase,
  updateDefaultDeliveryFeeUseCase,
  updateStoreIdentityUseCase,
  storeRepo,
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

// ─── Default delivery fee ─────────────────────────────────────────────────────

export type SaveDefaultDeliveryFeeResult =
  | { success: true }
  | { success: false; error: string };

export async function saveDefaultDeliveryFee(
  fee: number,
): Promise<SaveDefaultDeliveryFeeResult> {
  try {
    const session = await getSession();
    await updateDefaultDeliveryFeeUseCase.execute(session.storeId, fee);
    return { success: true };
  } catch (err) {
    const message =
      err instanceof AppError
        ? err.message
        : "Não foi possível salvar. Tente novamente.";
    return { success: false, error: message };
  }
}

// ─── Store identity (name + slug) ─────────────────────────────────────────────

export type SaveStoreIdentityResult =
  | { success: true }
  | { success: false; error: string };

export async function saveStoreIdentity(
  name: string,
  slug: string,
): Promise<SaveStoreIdentityResult> {
  try {
    const session = await getSession();
    await updateStoreIdentityUseCase.execute(session.storeId, { name, slug });
    return { success: true };
  } catch (err) {
    const message =
      err instanceof AppError
        ? err.message
        : "Não foi possível salvar. Tente novamente.";
    return { success: false, error: message };
  }
}

export type CheckSlugResult = { available: boolean };

export async function checkSlugAvailability(
  slug: string,
): Promise<CheckSlugResult> {
  try {
    const session = await getSession();
    const taken = await storeRepo.isSlugTaken(slug, session.storeId);
    return { available: !taken };
  } catch {
    return { available: false };
  }
}
