import { productImageController } from "@/infra/composition";

export const GET = productImageController.listImages;
export const POST = productImageController.addImage;
