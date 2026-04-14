import { prisma } from "./prisma";

// ---------------------------------------------------------------------------
// Token metadata — persisted in Postgres via Prisma
// ---------------------------------------------------------------------------

export type CachedTokenMeta = {
  name: string;
  symbol: string;
  logoUri: string | null;
  metadataUri: string | null;
  decimals: number | null;
};

export async function metaGet(
  network: string,
  mint: string,
): Promise<CachedTokenMeta | null> {
  try {
    const row = await prisma.tokenMetadata.findUnique({
      where: { network_mint: { network, mint } },
    });
    if (!row) return null;
    return {
      name: row.name,
      symbol: row.symbol,
      logoUri: row.logoUri,
      metadataUri: row.metadataUri,
      decimals: row.decimals,
    };
  } catch {
    return null;
  }
}

export async function metaSet(
  network: string,
  mint: string,
  data: CachedTokenMeta,
): Promise<void> {
  try {
    await prisma.tokenMetadata.upsert({
      where: { network_mint: { network, mint } },
      update: {
        name: data.name,
        symbol: data.symbol,
        logoUri: data.logoUri,
        metadataUri: data.metadataUri,
        decimals: data.decimals,
      },
      create: {
        network,
        mint,
        name: data.name,
        symbol: data.symbol,
        logoUri: data.logoUri,
        metadataUri: data.metadataUri,
        decimals: data.decimals,
      },
    });
  } catch {
        // write-through: swallow errors so the API still returns

  }
}

// ---------------------------------------------------------------------------
// In-memory TTL cache — portfolio (60 s) and activity (5 min)
// ---------------------------------------------------------------------------

type MemEntry<T> = { value: T; expiresAt: number };
const mem = new Map<string, MemEntry<unknown>>();

export function cacheGet<T>(key: string): T | null {
  const e = mem.get(key) as MemEntry<T> | undefined;
  if (!e) return null;
  if (Date.now() > e.expiresAt) {
    mem.delete(key);
    return null;
  }
  return e.value;
}

export function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number,
): void {
  mem.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

// ---------------------------------------------------------------------------
// TTL constants & key builders (unchanged API for route callers)
// ---------------------------------------------------------------------------

export const PORTFOLIO_TTL_SEC = 60;
export const ACTIVITY_TTL_SEC = 5 * 60;

export function portfolioKey(network: string, owner: string): string {
  return `portfolio:${network}:${owner}`;
}

export function activityKey(
  network: string,
  owner: string,
  limit: number,
): string {
  return `activity:${network}:${owner}:${limit}`;
}
