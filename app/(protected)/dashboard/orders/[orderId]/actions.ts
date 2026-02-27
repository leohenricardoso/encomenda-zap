"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/infra/http/auth/getSession";
import { orderRepo } from "@/infra/composition";
import { OrderStatus, canTransitionTo } from "@/domain/order/Order";
import { AppError } from "@/shared/errors/AppError";

/**
 * updateOrderStatus — Server Action for status transitions from the detail page.
 *
 * Re-validates both the detail page and the dashboard list so both reflect
 * the new state without a full refresh.
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await getSession();

    const current = await orderRepo.findById(orderId, session.storeId);
    if (!current) return { success: false, error: "Pedido não encontrado." };

    if (!canTransitionTo(current.status, newStatus)) {
      return { success: false, error: "Transição de status não permitida." };
    }

    await orderRepo.updateStatus(orderId, session.storeId, newStatus);

    revalidatePath(`/dashboard/orders/${orderId}`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err) {
    const message =
      err instanceof AppError
        ? err.message
        : "Erro inesperado. Tente novamente.";
    return { success: false, error: message };
  }
}
