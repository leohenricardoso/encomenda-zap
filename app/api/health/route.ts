import { prisma } from "@/lib/prisma";
import { ok, errorResponse, HttpStatus } from "@/shared/http";

/**
 * GET /api/health
 * Lightweight liveness + DB connectivity check.
 * Returns 200 when the app and database are reachable.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return ok({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch {
    return errorResponse(
      "Database unreachable",
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
