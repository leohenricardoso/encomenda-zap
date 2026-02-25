import { storeCepRangeController } from "@/infra/composition";

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return storeCepRangeController.remove(req, ctx);
}
