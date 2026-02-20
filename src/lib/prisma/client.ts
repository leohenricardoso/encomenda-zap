import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

declare global {
  // evita múltiplas instâncias durante o hot-reload do Next.js em dev
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

export default prisma;
