import type { IOrderRepository } from "@/domain/order/IOrderRepository";
import {
  OrderStatus,
  OrderTrackingStatus,
  canTrackingTransitionTo,
} from "@/domain/order/Order";
import type { Order } from "@/domain/order/Order";
import { AppError } from "@/shared/errors/AppError";

/**
 * UpdateOrderTrackingStatusUseCase
 *
 * Transitions the post-approval tracking status of an order.
 *
 * Business rules enforced here (before hitting the DB):
 *   1. Order must exist and belong to the store.
 *   2. Decision status must be APPROVED — tracking only applies to approved orders.
 *   3. Transition must be valid per TRACKING_ALLOWED_TRANSITIONS.
 */
export class UpdateOrderTrackingStatusUseCase {
  constructor(private readonly orderRepo: IOrderRepository) {}

  async execute(
    orderId: string,
    storeId: string,
    newStatus: OrderTrackingStatus,
  ): Promise<Order> {
    const order = await this.orderRepo.findById(orderId, storeId);

    if (!order) {
      throw new AppError("Pedido não encontrado.", 404);
    }

    if (order.status !== OrderStatus.APPROVED) {
      throw new AppError(
        "O acompanhamento de pedido só está disponível para pedidos aprovados.",
        409,
      );
    }

    const current = order.orderStatus ?? OrderTrackingStatus.PENDING;

    if (!canTrackingTransitionTo(current, newStatus)) {
      throw new AppError(
        `Transição de acompanhamento não permitida: ${current} → ${newStatus}.`,
        409,
      );
    }

    const updated = await this.orderRepo.updateTrackingStatus(
      orderId,
      storeId,
      newStatus,
    );

    if (!updated) {
      throw new AppError("Pedido não encontrado.", 404);
    }

    return updated;
  }
}
