import { adminStoreController } from "@/infra/composition";

export const GET = adminStoreController.list;
export const POST = adminStoreController.create;
