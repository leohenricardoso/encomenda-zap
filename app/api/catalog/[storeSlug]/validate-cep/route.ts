import { storeCepRangeController } from "@/infra/composition";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ storeSlug: string }> },
) {
  return storeCepRangeController.validatePublic(req, ctx);
}
