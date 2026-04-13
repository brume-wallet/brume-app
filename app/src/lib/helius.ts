import type { NetworkId } from "@brume/shared/constants";
import type { PortfolioTokenRow } from "@brume/shared/portfolio-types";

const DAS_ORIGIN: Record<NetworkId, string> = {
  "mainnet-beta": "https://mainnet.helius-rpc.com",
  devnet: "https://devnet.helius-rpc.com",
};

const PARSED_API: Record<NetworkId, string> = {
  "mainnet-beta": "https://api-mainnet.helius-rpc.com",
  devnet: "https://api-devnet.helius-rpc.com",
};

interface DasAsset {
  id?: string;
  interface?: string;
  content?: {
    json_uri?: string;
    /** Helius sometimes camelCases this */
    jsonUri?: string;
    metadata?: { name?: string; symbol?: string };
    links?: { image?: string };
    files?: Array<{ uri?: string; cdn_uri?: string }>;
  };
  token_info?: {
    balance?: string;
    decimals?: number;
    symbol?: string;
  };
}

export type HeliusDasTokenMeta = {
  name: string;
  symbol: string;
  logoUri: string | null;
  metadataUri: string | null;
  decimals: number | null;
};

function pickLogoFromDasAsset(a: DasAsset): string | null {
  const l = a.content?.links?.image;
  if (typeof l === "string" && l.length > 0) return l.trim();
  const files = a.content?.files;
  if (Array.isArray(files) && files.length > 0) {
    const u = files[0]?.cdn_uri ?? files[0]?.uri;
    if (typeof u === "string" && u.startsWith("http")) return u.trim();
  }
  return null;
}

function dasMetadataUri(a: DasAsset): string | null {
  const ju = a.content?.json_uri ?? a.content?.jsonUri;
  if (typeof ju === "string" && ju.length > 0) return ju.trim().slice(0, 2048);
  return null;
}

/**
 * Map one DAS asset for metadata. Does not invent mint-truncated names — those are not
 * useful and get cached as if they were real (e.g. SPL with only token_info.decimals).
 */
export function mapDasAssetToTokenMeta(
  a: DasAsset,
): HeliusDasTokenMeta | null {
  const id = a.id?.trim();
  if (!id) return null;

  const logoUri = pickLogoFromDasAsset(a);
  const metadataUri = dasMetadataUri(a);
  const decimals =
    typeof a.token_info?.decimals === "number" ? a.token_info.decimals : null;

  /** Prefer token_info.symbol (often correct for SPL); metadata can be sparse/wrong. */
  const rawSym = (
    a.token_info?.symbol ??
    a.content?.metadata?.symbol ??
    ""
  ).trim();
  const rawName = (a.content?.metadata?.name ?? "").trim();

  const hasText = Boolean(rawName || rawSym);
  const hasOffChainPointer = Boolean(metadataUri);
  const hasLogo = Boolean(logoUri);
  /** Single junk char in metadata.name with no symbol (seen on some SPL index rows). */
  const trivialInline =
    rawName.length <= 1 && !rawSym && !hasLogo && !hasOffChainPointer;

  if (!hasText && !hasLogo && !hasOffChainPointer && decimals == null) {
    return null;
  }

  /** Decimals-only index row — let Metaplex / JSON / Jupiter handle the rest. */
  if (!hasText && !hasLogo && !hasOffChainPointer && decimals != null) {
    return null;
  }

  if (trivialInline && decimals != null) {
    return null;
  }

  const name = rawName.slice(0, 48);
  const symbol = rawSym.slice(0, 12);

  return {
    name,
    symbol,
    logoUri,
    metadataUri,
    decimals,
  };
}

function unwrapDasAssetBatchResult(raw: unknown): DasAsset[] {
  if (Array.isArray(raw)) return raw.filter(Boolean) as DasAsset[];
  if (
    raw &&
    typeof raw === "object" &&
    Array.isArray((raw as { items?: unknown }).items)
  ) {
    return ((raw as { items: DasAsset[] }).items ?? []).filter(Boolean);
  }
  return [];
}

const DAS_BATCH_LIMIT = 1_000;

async function postDas<R>(
  apiKey: string,
  network: NetworkId,
  body: Record<string, unknown>,
): Promise<R> {
  const origin = DAS_ORIGIN[network];
  const url = new URL(origin);
  url.searchParams.set("api-key", apiKey);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`DAS ${res.status}${t ? `: ${t.slice(0, 120)}` : ""}`);
  }

  const json = (await res.json()) as { result?: R; error?: { message?: string } };
  if (json.error?.message) throw new Error(json.error.message);
  return json.result as R;
}

interface DasResponse {
  result?: {
    items?: DasAsset[];
    nativeBalance?: { lamports?: number };
  };
}

function isFungibleLike(a: DasAsset): boolean {
  const i = (a.interface ?? "").toLowerCase();
  if (i === "fungible_token" || i === "fungibletoken") return true;
  if (i.includes("nft") && !i.includes("fungible")) return false;
  const d = a.token_info?.decimals;
  return typeof d === "number" && d > 0 && a.token_info?.balance != null;
}

export interface DasPortfolioServerResult {
  tokens: PortfolioTokenRow[];
  nativeLamports: bigint | null;
}

export async function heliusDasGetAssetsByOwner(
  apiKey: string,
  network: NetworkId,
  ownerAddress: string,
): Promise<DasPortfolioServerResult> {
  const origin = DAS_ORIGIN[network];
  const url = new URL(origin);
  url.searchParams.set("api-key", apiKey);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "brume-das",
      method: "getAssetsByOwner",
      params: {
        ownerAddress,
        page: 1,
        limit: 1000,
      },
    }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`DAS ${res.status}${t ? `: ${t.slice(0, 120)}` : ""}`);
  }

  const json = (await res.json()) as DasResponse & {
    error?: { message?: string };
  };
  if (json.error?.message) {
    throw new Error(json.error.message);
  }

  const items = json.result?.items ?? [];
  const nativeLamports =
    json.result?.nativeBalance?.lamports != null
      ? BigInt(Math.trunc(json.result.nativeBalance.lamports))
      : null;

  const tokens: PortfolioTokenRow[] = [];
  for (const a of items) {
    if (!isFungibleLike(a)) continue;
    const mint = a.id ?? "";
    if (!mint) continue;
    const decimals = a.token_info?.decimals ?? 0;
    const bal = a.token_info?.balance ?? "0";
    const symbol =
      (a.token_info?.symbol ?? a.content?.metadata?.symbol ?? "?").slice(0, 12);
    const name = (a.content?.metadata?.name ?? symbol).slice(0, 48);
    const logoUri = a.content?.links?.image ?? null;
    tokens.push({
      mint,
      symbol: symbol || "?",
      name: name || symbol || "Token",
      amountRaw: bal,
      decimals,
      logoUri,
    });
  }

  return { tokens, nativeLamports };
}

export async function heliusDasGetTokenMetadataBatch(
  apiKey: string,
  network: NetworkId,
  mints: string[],
): Promise<Map<string, HeliusDasTokenMeta>> {
  const out = new Map<string, HeliusDasTokenMeta>();
  const unique = [...new Set(mints.map((m) => m.trim()).filter(Boolean))];
  if (unique.length === 0) return out;

  for (let i = 0; i < unique.length; i += DAS_BATCH_LIMIT) {
    const ids = unique.slice(i, i + DAS_BATCH_LIMIT);
    const raw = await postDas<unknown>(apiKey, network, {
      jsonrpc: "2.0",
      id: `brume-das-batch-${i}`,
      method: "getAssetBatch",
      params: {
        ids,
        options: { showFungible: true },
      },
    });

    const assets = unwrapDasAssetBatchResult(raw);
    for (const a of assets) {
      const row = mapDasAssetToTokenMeta(a);
      const id = a.id?.trim();
      if (row && id) out.set(id, row);
    }
  }

  return out;
}

export function heliusParsedTxBase(network: NetworkId): string | null {
  return PARSED_API[network] ?? null;
}
