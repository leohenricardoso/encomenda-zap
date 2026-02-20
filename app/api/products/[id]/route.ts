import { productController } from "@/infra/composition";

export const GET    = productController.getById;
export const PUT    = productController.update;
export const DELETE = productController.delete;

