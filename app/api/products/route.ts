import { productController } from "@/infra/composition";

export const POST = productController.create;
export const GET  = productController.list;

