import { categoryController } from "@/infra/composition";

export const GET = categoryController.listProducts;
export const POST = categoryController.assignProduct;
