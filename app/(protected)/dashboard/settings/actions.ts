"use server";

import { getSession } from "@/infra/http/auth/getSession";
import { updateStoreWhatsappUseCase } from "@/infra/composition";
import { AppError } from "@/shared/errors/AppError";

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
