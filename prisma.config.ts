import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// CLI-only config (migrate, studio, seed). The app runtime connects through
// the driver adapter in src/server/db.ts using DATABASE_URL instead.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed/seed.mts",
  },
  datasource: {
    // Session pooler (port 5432): migrations need a session-scoped connection.
    url: env("DIRECT_URL"),
  },
});
