export const JUPITER_LITE_PRICE_V3 =
  "https://lite-api.jup.ag/price/v3/price" as const;

export const JUPITER_SOL_PRICE_MINT =
  "So11111111111111111111111111111111111111112" as const;

export const FALLBACK_SOL_USD = 150;

type JupiterPriceRow = { usdPrice?: number };

type MintCacheEntry = { usd: number; expiresAt: number };

const mintCache = new Map<string, MintCacheEntry>();
const TTL_MS = 60_000;
const MAX_IDS_PER_REQUEST = 50;

function readCachedUsd(mint: string, now: number): number | undefined {
  const e = mintCache.get(mint);
  if (e && e.expiresAt > now) return e.usd;
  return undefined;
}

async function fetchPriceChunk(mints: string[]): Promise<void> {
  if (mints.length === 0) return;
  const url = `${JUPITER_LITE_PRICE_V3}?ids=${mints.join(",")}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`jupiter price ${res.status}`);
  const data = (await res.json()) as Record<string, JupiterPriceRow>;
  const now = Date.now();
  for (const id of mints) {
    const row = data[id];
    const usd = row?.usdPrice;
    if (typeof usd === "number" && Number.isFinite(usd) && usd > 0) {
      mintCache.set(id, { usd, expiresAt: now + TTL_MS });
    }
  }
}

export async function getJupiterUsdPricesForMints(
  mints: readonly string[],
  opts?: { bypassCache?: boolean },
): Promise<Map<string, number>> {
  const unique = [...new Set(mints.filter(Boolean))];
  const now = Date.now();

  if (opts?.bypassCache) {
    for (const m of unique) mintCache.delete(m);
  }

  const needFetch = unique.filter((m) => readCachedUsd(m, now) === undefined);

  for (let i = 0; i < needFetch.length; i += MAX_IDS_PER_REQUEST) {
    const chunk = needFetch.slice(i, i + MAX_IDS_PER_REQUEST);
    try {
      await fetchPriceChunk(chunk);
    } catch {
      // keep partial cache / other chunks may succeed.
    }
  }

  const out = new Map<string, number>();
  const t = Date.now();
  for (const m of unique) {
    const usd = readCachedUsd(m, t);
    if (usd !== undefined) out.set(m, usd);
  }

  if (
    unique.includes(JUPITER_SOL_PRICE_MINT) &&
    !out.has(JUPITER_SOL_PRICE_MINT)
  ) {
    const fb = FALLBACK_SOL_USD;
    out.set(JUPITER_SOL_PRICE_MINT, fb);
    mintCache.set(JUPITER_SOL_PRICE_MINT, {
      usd: fb,
      expiresAt: t + TTL_MS,
    });
  }

  return out;
}

export async function getSolUsdFromJupiter(): Promise<number> {
  const m = await getJupiterUsdPricesForMints([JUPITER_SOL_PRICE_MINT]);
  return m.get(JUPITER_SOL_PRICE_MINT) ?? FALLBACK_SOL_USD;
}
