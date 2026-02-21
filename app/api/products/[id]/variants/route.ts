import { productVariantController } from "@/infra/composition";

export const dynamic = "force-dynamic";

// POST /api/products/:id/variants
export const POST = productVariantController.create;
