import { config as loadEnv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "prisma/config";

const appRoot = path.dirname(fileURLToPath(import.meta.url));

// Next.js uses .env.local; Prisma CLI only auto-loaded .env before — load both, local wins.
loadEnv({ path: path.join(appRoot, ".env") });
loadEnv({ path: path.join(appRoot, ".env.local"), override: true });

function envUrl(name: string): string | undefined {
  const raw = process.env[name]?.trim();
  if (!raw) return undefined;
  // Strip accidental wrapping quotes from .env lines
  const v = raw.replace(/^["']|["']$/g, "").trim();
  return v || undefined;
}

// Prisma CLI (db push, migrate, studio) needs a direct Postgres connection.
// On Supabase use DIRECT_URL (port 5432). Pooler DATABASE_URL can hang for schema ops.
const datasourceUrl =
  envUrl("DIRECT_URL") ||
  envUrl("DATABASE_URL") ||
  "postgresql://placeholder:placeholder@localhost:5432/brume";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: datasourceUrl,
  },
});
