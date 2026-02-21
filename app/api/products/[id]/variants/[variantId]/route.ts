import { productVariantController } from "@/infra/composition";

export const dynamic = "force-dynamic";

// PUT  /api/products/:id/variants/:variantId
export const PUT = productVariantController.update;

// DELETE /api/products/:id/variants/:variantId
export const DELETE = productVariantController.delete;
