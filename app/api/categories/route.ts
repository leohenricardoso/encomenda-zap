import { categoryController } from "@/infra/composition";

export const GET = categoryController.list;
export const POST = categoryController.create;
