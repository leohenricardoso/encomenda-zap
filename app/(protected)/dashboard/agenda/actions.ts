"use server";

import { getSession } from "@/infra/http/auth/getSession";
import { updateMinimumAdvanceDaysUseCase } from "@/infra/composition";
import { AppError } from "@/shared/errors/AppError";

export type SaveMinimumAdvanceDaysResult =
  | { success: true }
  | { success: false; error: string };

export async function saveMinimumAdvanceDays(
  days: number,
): Promise<SaveMinimumAdvanceDaysResult> {
  try {
    const session = await getSession();
    await updateMinimumAdvanceDaysUseCase.execute(session.storeId, days);
    return { success: true };
  } catch (err) {
    const message =
      err instanceof AppError
        ? err.message
        : "Não foi possível salvar. Tente novamente.";
    return { success: false, error: message };
  }
}
