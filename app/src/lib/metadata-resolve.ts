import { Buffer } from "node:buffer";
import { Connection, PublicKey } from "@solana/web3.js";
import type { NetworkId } from "@brume/shared/constants";
import type { PortfolioTokenRow } from "@brume/shared/portfolio-types";
import {
  heliusDasGetTokenMetadataBatch,
  type HeliusDasTokenMeta,
} from "./helius";
import { metaGet, metaSet } from "./token-cache";
import type { CachedTokenMeta } from "./token-cache";

const METADATA_PROGRAM = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
);

export type TokenMetaResolved = {
  name: string;
  symbol: string;
  logoUri: string | null;
  metadataUri: string | null;
  decimals: number | null;
};

type JupiterTokenRow = { address?: string; logoURI?: string };

let jupiterStrictCache: Map<string, string> | null = null;
let jupiterLoadPromise: Promise<void> | null = null;

async function ensureJupiterStrictLoaded(): Promise<void> {
  if (jupiterStrictCache) return;
  if (jupiterLoadPromise) return jupiterLoadPromise;

  jupiterLoadPromise = (async () => {
    const m = new Map<string, string>();
    try {
      const res = await fetch("https://token.jup.ag/strict");
      if (!res.ok) return;
      const list = (await res.json()) as JupiterTokenRow[];
      if (!Array.isArray(list)) return;
      for (const row of list) {
        const addr = row.address?.trim();
        const logo = row.logoURI?.trim();
        if (addr && logo) m.set(addr, logo);
      }
    } catch {
      /* ignore */
    }
    jupiterStrictCache = m;
  })();

  await jupiterLoadPromise;
}

export async function jupiterStrictLogoForMint(mint: string): Promise<string | null> {
  await ensureJupiterStrictLoaded();
  return jupiterStrictCache?.get(mint) ?? null;
}

async function logoFromDexScreener(mint: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(mint)}`,
    );
    if (!res.ok) return null;
    const j = (await res.json()) as {
      pairs?: Array<{
        info?: { imageUrl?: string };
        baseToken?: { address?: string; imageUrl?: string };
      }>;
    };
    const pairs = j.pairs;
    if (!Array.isArray(pairs) || pairs.length === 0) return null;
    for (const p of pairs) {
      const img =
        p.info?.imageUrl ??
        (p.baseToken?.address === mint ? p.baseToken?.imageUrl : undefined);
      if (typeof img === "string" && img.startsWith("http")) return img;
    }
    const first = pairs[0];
    const fallback = first?.info?.imageUrl ?? first?.baseToken?.imageUrl;
    return typeof fallback === "string" && fallback.startsWith("http")
      ? fallback
      : null;
  } catch {
    return null;
  }
}

function readBorshString(buf: Uint8Array, off: number): { s: string; next: number } {
  if (off + 4 > buf.length) return { s: "", next: off };
  const dv = new DataView(buf.buffer, buf.byteOffset + off, 4);
  const len = dv.getUint32(0, true);
  const start = off + 4;
  if (len > 10_000 || start + len > buf.length) return { s: "", next: start };
  const s = new TextDecoder().decode(buf.subarray(start, start + len));
  return { s: s.replace(/\0/g, "").trim(), next: start + len };
}

function normalizeOffchainUri(uri: string): string {
  const u = uri.trim();
  if (u.startsWith("ipfs://")) return `https://ipfs.io/ipfs/${u.slice(7)}`;
  return u;
}

async function metaplexOnChainFields(
  conn: Connection,
  mint: string,
): Promise<{ name: string; symbol: string; uri: string } | null> {
  try {
    const mintPk = new PublicKey(mint);
    const [pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        METADATA_PROGRAM.toBuffer(),
        mintPk.toBuffer(),
      ],
      METADATA_PROGRAM,
    );
    const info = await conn.getAccountInfo(pda, "confirmed");
    const data = info?.data;
    if (!data || data.length < 65) return null;
    let o = 1 + 32 + 32;
    const name = readBorshString(data, o);
    o = name.next;
    const symbol = readBorshString(data, o);
    o = symbol.next;
    const uri = readBorshString(data, o);
    return {
      name: name.s || "",
      symbol: symbol.s || "",
      uri: uri.s || "",
    };
  } catch {
    return null;
  }
}

async function jsonFromMetadataUri(uri: string): Promise<{
  name?: string;
  symbol?: string;
  image?: string;
  properties?: { files?: Array<{ uri?: string }> };
} | null> {
  try {
    const url = normalizeOffchainUri(uri);
    if (!url.startsWith("http")) return null;
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) return null;
    return (await res.json()) as {
      name?: string;
      symbol?: string;
      image?: string;
      properties?: { files?: Array<{ uri?: string }> };
    };
  } catch {
    return null;
  }
}

function pickImageFromJson(j: {
  image?: string;
  properties?: { files?: Array<{ uri?: string }> };
}): string | null {
  if (typeof j.image === "string" && j.image.length > 0) {
    const u = normalizeOffchainUri(j.image);
    if (u.startsWith("http")) return u;
  }
  const f = j.properties?.files?.[0]?.uri;
  if (typeof f === "string" && f.length > 0) {
    const u = normalizeOffchainUri(f);
    if (u.startsWith("http")) return u;
  }
  return null;
}

async function mintDecimals(
  conn: Connection,
  mint: string,
): Promise<number | null> {
  try {
    const parsed = await conn.getParsedAccountInfo(new PublicKey(mint));
    const d = parsed.value?.data;
    if (!d || !("parsed" in d) || d.parsed.type !== "mint") return null;
    const dec = (d.parsed.info as { decimals?: number }).decimals;
    return typeof dec === "number" ? dec : null;
  } catch {
    return null;
  }
}

function mintShortLabel(mint: string): string {
  const t = mint.replace(/\s/g, "");
  if (t.length <= 5) return t || "?";
  return `${t.slice(0, 4)}…`;
}

/** True if cached labels are mint-derived placeholders (must not short-circuit resolve). */
function isMintDerivedPlaceholder(
  name: string,
  symbol: string,
  mint: string,
): boolean {
  const m = mint.replace(/\s/g, "");
  if (!m) return false;
  const short = mintShortLabel(m);
  const n = name.trim();
  const s = symbol.trim();
  if (s === short || n === short) return true;
  if (s.endsWith("…") && m.length > 4 && m.startsWith(s.slice(0, 4))) return true;
  if (n.endsWith("…") && m.length > 4 && m.startsWith(n.slice(0, 4))) return true;
  if (n.length === 1 && /^[A-Za-z0-9]$/.test(n)) return true;
  if (s.length === 1 && /^[0-9]$/.test(s)) return true;
  return false;
}

/** MV3 extension pages often allow https images only; upgrade http logos when possible. */
function preferHttpsLogoUri(uri: string | null): string | null {
  if (!uri || !uri.startsWith("http://")) return uri;
  try {
    const u = new URL(uri);
    return `https://${u.host}${u.pathname}${u.search}${u.hash}`;
  } catch {
    return uri;
  }
}

function needsEnrichment(t: PortfolioTokenRow): boolean {
  const sym = (t.symbol ?? "").trim();
  const name = (t.name ?? "").trim().toLowerCase();
  if (!t.logoUri && sym.length <= 1) return true;
  if (sym === "?" || sym === "") return true;
  if (name === "unknown token" || name === "") return true;
  if (isMintDerivedPlaceholder(t.name ?? "", t.symbol ?? "", t.mint)) return true;
  /** Indexer gave image + title but left ticker as mint slice / empty — still resolve. */
  if (
    t.logoUri &&
    name !== "" &&
    name !== "unknown token" &&
    (!sym || sym === "?" || isMintDerivedPlaceholder("", sym, t.mint))
  ) {
    return true;
  }
  return false;
}

export type ResolveTokenMetadataOptions = {
  /** When set, DAS data from a parent batch (e.g. activity); skips a duplicate getAssetBatch for this mint. */
  dasPrefill?: HeliusDasTokenMeta | null;
};

/** Full metadata for one mint (DAS when available, Postgres, on-chain + off-chain fallbacks). */
export async function resolveTokenMetadata(
  network: NetworkId,
  mint: string,
  conn: Connection,
  options?: ResolveTokenMetadataOptions,
): Promise<TokenMetaResolved> {
  const cached = await metaGet(network, mint);
  if (
    cached?.name &&
    cached?.symbol &&
    !isMintDerivedPlaceholder(cached.name, cached.symbol, mint)
  ) {
    const dec = cached.decimals ?? (await mintDecimals(conn, mint));
    return {
      ...cached,
      decimals: dec,
      logoUri: preferHttpsLogoUri(cached.logoUri),
    };
  }

  let name = cached?.name ?? "";
  let symbol = cached?.symbol ?? "";
  let logoUri = cached?.logoUri ?? null;
  let metadataUri = cached?.metadataUri ?? null;
  let decimalsFromDas: number | null = null;

  let dasRow: HeliusDasTokenMeta | null = null;
  if (options?.dasPrefill != null) {
    dasRow = options.dasPrefill;
  } else {
    const apiKey = process.env.HELIUS_API_KEY?.trim();
    if (apiKey) {
      try {
        const m = await heliusDasGetTokenMetadataBatch(apiKey, network, [mint]);
        dasRow = m.get(mint) ?? null;
      } catch {
        /* DAS optional */
      }
    }
  }

  if (dasRow) {
    if (dasRow.name?.trim()) name = dasRow.name;
    if (dasRow.symbol?.trim()) symbol = dasRow.symbol;
    if (dasRow.logoUri) logoUri = dasRow.logoUri;
    if (dasRow.metadataUri) metadataUri = dasRow.metadataUri;
    if (dasRow.decimals != null) decimalsFromDas = dasRow.decimals;
  }

  const weakAfterDas =
    !name.trim() ||
    !symbol.trim() ||
    isMintDerivedPlaceholder(name, symbol, mint);
  if (metadataUri && weakAfterDas) {
    const j = await jsonFromMetadataUri(metadataUri);
    if (j) {
      if (typeof j.name === "string" && j.name.trim())
        name = j.name.trim().slice(0, 48);
      if (typeof j.symbol === "string" && j.symbol.trim())
        symbol = j.symbol.trim().slice(0, 12);
      const img = pickImageFromJson(j);
      if (img) logoUri = img;
    }
  }

  const jup = await jupiterStrictLogoForMint(mint);
  if (jup && !logoUri) logoUri = jup;

  const onChain = await metaplexOnChainFields(conn, mint);
  if (onChain) {
    if (onChain.name) name = onChain.name.slice(0, 48);
    if (onChain.symbol) symbol = onChain.symbol.slice(0, 12);
    if (onChain.uri) {
      metadataUri = onChain.uri.slice(0, 2048);
      const j = await jsonFromMetadataUri(onChain.uri);
      if (j) {
        if (typeof j.name === "string" && j.name.trim())
          name = j.name.trim().slice(0, 48);
        if (typeof j.symbol === "string" && j.symbol.trim())
          symbol = j.symbol.trim().slice(0, 12);
        const img = pickImageFromJson(j);
        if (img) logoUri = img;
      }
    }
  }

  if (!logoUri) {
    const dex = await logoFromDexScreener(mint);
    if (dex) logoUri = dex;
  }

  if (!symbol || symbol === "?") symbol = mintShortLabel(mint);
  if (!name || name.toLowerCase() === "unknown token") {
    name = symbol !== "?" ? symbol : `Token ${mintShortLabel(mint)}`;
  }

  const decimals =
    decimalsFromDas ?? (await mintDecimals(conn, mint));

  const out: TokenMetaResolved = {
    name,
    symbol,
    logoUri: preferHttpsLogoUri(logoUri),
    metadataUri,
    decimals,
  };
  await metaSet(network, mint, out as CachedTokenMeta);
  return out;
}

export async function enrichPortfolioRows(
  network: NetworkId,
  conn: Connection,
  tokens: PortfolioTokenRow[],
): Promise<PortfolioTokenRow[]> {
  const out: PortfolioTokenRow[] = [];
  for (const t of tokens) {
    if (!needsEnrichment(t)) {
      out.push(t);
      continue;
    }
    const m = await resolveTokenMetadata(network, t.mint, conn);
    const decimalsResolved =
      m.decimals != null &&
      Number.isFinite(m.decimals) &&
      m.decimals >= 0 &&
      m.decimals <= 18
        ? m.decimals
        : t.decimals;
    out.push({
      ...t,
      name: m.name || t.name,
      symbol: m.symbol || t.symbol,
      logoUri: m.logoUri ?? t.logoUri,
      decimals: decimalsResolved,
    });
    await new Promise((r) => setTimeout(r, 40));
  }
  return out;
}
