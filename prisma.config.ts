import { config } from "dotenv";
config({ path: ".env.local" }); // Neon (local override)
config(); // fallback: Docker local (.env)

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "src/infra/prisma/schema.prisma",
  migrations: {
    path: "src/infra/prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
