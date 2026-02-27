import { type NextRequest } from "next/server";
import { storeCepRangeController } from "@/infra/composition";

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  return storeCepRangeController.remove(req, ctx);
}
