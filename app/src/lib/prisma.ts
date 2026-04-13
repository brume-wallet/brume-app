import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  /** Pooled URL (Supabase Transaction pooler) preferred at runtime; fall back to direct. */
  const connectionString =
    process.env.DATABASE_URL?.trim() || process.env.DIRECT_URL?.trim();
  if (!connectionString) {
    throw new Error("Set DATABASE_URL (pooled) or DIRECT_URL in .env.local");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter, log: ["warn", "error"] });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
