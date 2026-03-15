import { adminStoreController } from "@/infra/composition";

export const GET = adminStoreController.getById;
export const PATCH = adminStoreController.update;
