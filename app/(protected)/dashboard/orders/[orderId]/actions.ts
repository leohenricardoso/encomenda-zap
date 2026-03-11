"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/infra/http/auth/getSession";
import {
  orderRepo,
  updateOrderTrackingStatusUseCase,
} from "@/infra/composition";
import {
  OrderStatus,
  OrderTrackingStatus,
  canTransitionTo,
} from "@/domain/order/Order";
import { AppError } from "@/shared/errors/AppError";

/**
 * updateOrderStatus — Server Action for decision status transitions.
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

/**
 * updateOrderTrackingStatus — Server Action for post-approval tracking transitions.
 *
 * Only valid when the order's decision status is APPROVED.
 */
export async function updateOrderTrackingStatus(
  orderId: string,
  newStatus: OrderTrackingStatus,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await getSession();
    await updateOrderTrackingStatusUseCase.execute(
      orderId,
      session.storeId,
      newStatus,
    );

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
