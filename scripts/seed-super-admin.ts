/**
 * seed-super-admin.ts
 *
 * Creates the first Super Admin account in the database.
 * Credentials are read from environment variables or CLI arguments.
 *
 * Usage:
 *   # With env vars (recommended)
 *   SUPER_ADMIN_EMAIL=admin@example.com SUPER_ADMIN_PASSWORD=changeme npx tsx scripts/seed-super-admin.ts
 *
 *   # Or inline args: --email admin@example.com --password changeme --name "Platform Admin"
 *   npx tsx scripts/seed-super-admin.ts --email admin@example.com --password changeme
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

// ── Parse CLI args ────────────────────────────────────────────────────────────
function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

const email = getArg("--email") ?? process.env.SUPER_ADMIN_EMAIL;
const password = getArg("--password") ?? process.env.SUPER_ADMIN_PASSWORD;
const name = getArg("--name") ?? process.env.SUPER_ADMIN_NAME ?? null;

// ── Validation ────────────────────────────────────────────────────────────────
if (!email || !email.includes("@")) {
  console.error(
    "Error: valid email is required via --email flag or SUPER_ADMIN_EMAIL env var.",
  );
  process.exit(1);
}

if (!password || password.length < 12) {
  console.error(
    "Error: password (min 12 chars) is required via --password flag or SUPER_ADMIN_PASSWORD env var.",
  );
  process.exit(1);
}

// ── Seed ─────────────────────────────────────────────────────────────────────
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(`Creating super admin: ${email}`);

  const existing = await prisma.superAdmin.findUnique({
    where: { email },
  });

  if (existing) {
    console.log("Super admin with this email already exists. Skipping.");
    return;
  }

  const passwordHash = await argon2.hash(password!, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const superAdmin = await prisma.superAdmin.create({
    data: {
      email,
      passwordHash,
      name: name ?? null,
      isActive: true,
    },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  console.log("Super admin created successfully:");
  console.log(`  id:    ${superAdmin.id}`);
  console.log(`  email: ${superAdmin.email}`);
  console.log(`  name:  ${superAdmin.name ?? "(none)"}`);
  console.log(`  created: ${superAdmin.createdAt.toISOString()}`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
