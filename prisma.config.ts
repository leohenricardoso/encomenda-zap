import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "src/lib/prisma/schema.prisma",
  migrations: {
    path: "src/lib/prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
