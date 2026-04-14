import type { NetworkId } from "@brume/shared/constants";
import type { ActivityItemDto } from "@brume/shared/activity-types";
import { Connection } from "@solana/web3.js";
type IconSlotLike = { kind: "sol" | "token"; mint?: string };
import {
  heliusDasGetTokenMetadataBatch,
  type HeliusDasTokenMeta,
} from "./helius";
import {
  resolveTokenMetadata,
  type TokenMetaResolved,
} from "./metadata-resolve";

const NATIVE_SOL_LOGO_URI =
  "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png";

function shortPk(pk: string, head = 4, tail = 4): string {
  if (!pk || pk.length <= head + tail + 1) return pk || "";
  return `${pk.slice(0, head)}…${pk.slice(-tail)}`;
}

// Human-readable ticker for activity lines (matches on-chain / Metaplex metadata).

function displaySymbolFromMeta(meta: TokenMetaResolved, mint: string): string {
  const sym = meta.symbol?.trim();
  if (sym && sym.length <= 24) return sym.slice(0, 20);
  const nm = meta.name?.trim();
  if (nm && nm.length >= 2 && nm.length <= 32) return nm.slice(0, 24);
  return shortPk(mint, 4, 4);
}

function rewriteActivityCopy(
  label: string | undefined,
  detail: string | undefined,
  rowMints: string[],
  symbolByMint: Map<string, string>,
): { label?: string; detail?: string } {
  let l = label;
  let d = detail;
  for (const mint of rowMints) {
    const sym = symbolByMint.get(mint);
    if (!sym) continue;
    const short = shortPk(mint, 4, 4);
    if (!short || short === sym) continue;
    if (l?.includes(short)) l = l.split(short).join(sym);
    if (d?.includes(short)) d = d.split(short).join(sym);
  }
  if (rowMints.length === 1) {
    const only = rowMints[0]!;
    const s = symbolByMint.get(only);
    if (s) {
      if (l === "Received Token") l = `Received ${s}`;
      if (l === "Sent Token") l = `Sent ${s}`;
      if (d && /\sToken$/.test(d)) d = d.replace(/\sToken$/, ` ${s}`);
    }
  }
  return { label: l, detail: d };
}

function errToString(err: unknown): string | null {
  if (err == null) return null;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err).slice(0, 240);
  } catch {
    return String(err);
  }
}

export async function attachActivityLogos(
  network: NetworkId,
  conn: Connection,
  rows: Array<{
    signature: string;
    slot: number | null;
    err: unknown;
    blockTime: number | null;
    summary?: string;
    txType?: string | null;
    source?: string | null;
    displayLabel?: string;
    displayDetail?: string;
    iconSlots?: IconSlotLike[];
    enrichmentMints?: string[];
  }>,
): Promise<ActivityItemDto[]> {
  const mints = new Set<string>();
  for (const r of rows) {
    for (const s of r.iconSlots ?? []) {
      if (s.kind === "token" && s.mint) mints.add(s.mint);
    }
    for (const m of r.enrichmentMints ?? []) {
      const t = m?.trim();
      if (t) mints.add(t);
    }
  }

  const apiKey = process.env.HELIUS_API_KEY?.trim();
  let dasByMint = new Map<string, HeliusDasTokenMeta>();
  if (apiKey && mints.size > 0) {
    try {
      dasByMint = await heliusDasGetTokenMetadataBatch(
        apiKey,
        network,
        [...mints],
      );
    } catch {
            // DAS optional

    }
  }

  const logoByMint = new Map<string, string | null>();
  const symbolByMint = new Map<string, string>();
  for (const m of mints) {
    const dasPrefill = dasByMint.get(m);
    const meta = await resolveTokenMetadata(
      network,
      m,
      conn,
      dasPrefill != null ? { dasPrefill } : undefined,
    );
    logoByMint.set(m, meta.logoUri);
    symbolByMint.set(m, displaySymbolFromMeta(meta, m));
    if (process.env.NODE_ENV === "development") {
      console.log("[activity] token", network, m, {
        das: Boolean(dasPrefill),
        name: meta.name,
        symbol: meta.symbol,
        decimals: meta.decimals,
        logoUri: meta.logoUri,
        metadataUri: meta.metadataUri,
      });
    }
    await new Promise((r) => setTimeout(r, 35));
  }

  return rows.map((r) => {
    const rowMintSet = new Set<string>();
    for (const s of r.iconSlots ?? []) {
      if (s.kind === "token" && s.mint?.trim()) rowMintSet.add(s.mint.trim());
    }
    for (const m of r.enrichmentMints ?? []) {
      const t = m?.trim();
      if (t) rowMintSet.add(t);
    }
    const rowMints = [...rowMintSet];
    const { label: displayLabel, detail: displayDetail } = rewriteActivityCopy(
      r.displayLabel,
      r.displayDetail,
      rowMints,
      symbolByMint,
    );

    return {
      signature: r.signature,
      slot: r.slot,
      err: errToString(r.err),
      blockTime: r.blockTime,
      summary: r.summary,
      txType: r.txType ?? null,
      source: r.source ?? null,
      displayLabel,
      displayDetail,
      activityIcons: (r.iconSlots ?? []).map((slot) => {
        if (slot.kind === "sol") {
          return { kind: "sol" as const, logoUri: NATIVE_SOL_LOGO_URI };
        }
        const mint = slot.mint ?? "";
        return {
          kind: "token" as const,
          mint,
          logoUri: logoByMint.get(mint) ?? null,
        };
      }),
    };
  });
}
