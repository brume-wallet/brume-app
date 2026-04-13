import type { ParsedAccountData } from "@solana/web3.js";
import { Connection, PublicKey } from "@solana/web3.js";
import type { PortfolioTokenRow } from "@brume/shared/portfolio-types";
import type { NetworkId } from "@brume/shared/constants";
import { getConnection } from "./rpc";
import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  type TokenProgramKind,
} from "./spl-programs";

export interface RpcTokenHolding {
  mint: string;
  amountRaw: string;
  decimals: number;
  tokenProgram: TokenProgramKind;
}

function mergeByMint(rows: RpcTokenHolding[]): RpcTokenHolding[] {
  const m = new Map<string, RpcTokenHolding>();
  for (const r of rows) {
    const prev = m.get(r.mint);
    if (!prev) {
      m.set(r.mint, { ...r });
      continue;
    }
    const sum = (BigInt(prev.amountRaw) + BigInt(r.amountRaw)).toString();
    m.set(r.mint, {
      mint: r.mint,
      amountRaw: sum,
      decimals: r.decimals,
      tokenProgram:
        prev.tokenProgram === r.tokenProgram
          ? prev.tokenProgram
          : r.tokenProgram,
    });
  }
  return [...m.values()];
}

export async function fetchRpcTokenHoldings(
  conn: Connection,
  owner: PublicKey,
): Promise<RpcTokenHolding[]> {
  const out: RpcTokenHolding[] = [];
  const programs: Array<{ id: PublicKey; kind: TokenProgramKind }> = [
    { id: TOKEN_PROGRAM_ID, kind: "token" },
    { id: TOKEN_2022_PROGRAM_ID, kind: "token-2022" },
  ];
  for (const { id, kind } of programs) {
    const res = await conn.getParsedTokenAccountsByOwner(owner, {
      programId: id,
    });
    for (const { account } of res.value) {
      const data = account.data as ParsedAccountData;
      const parsed = data.parsed;
      if (!parsed || parsed.type !== "account") continue;
      const info = parsed.info as {
        mint?: string;
        tokenAmount?: { amount?: string; decimals?: number };
      };
      const mint = info.mint;
      const ta = info.tokenAmount;
      if (!mint || !ta?.amount) continue;
      if (ta.amount === "0") continue;
      const decimals =
        typeof ta.decimals === "number" ? ta.decimals : 0;
      out.push({
        mint,
        amountRaw: ta.amount,
        decimals,
        tokenProgram: kind,
      });
    }
  }
  return mergeByMint(out);
}

function looksGoodSymbol(sym: string): boolean {
  const s = sym.trim();
  if (!s || s === "?") return false;
  return s.length <= 12;
}

function looksGoodName(name: string): boolean {
  const x = name.trim().toLowerCase();
  if (!x || x === "unknown token") return false;
  return true;
}

function baseRowFromRpc(h: RpcTokenHolding): PortfolioTokenRow {
  const short = h.mint.length > 5 ? `${h.mint.slice(0, 4)}…` : h.mint;
  return {
    mint: h.mint,
    symbol: short,
    name: "Unknown Token",
    amountRaw: h.amountRaw,
    decimals: h.decimals,
    logoUri: null,
    tokenProgram: h.tokenProgram,
  };
}

export function mergeDasAndRpcHoldings(
  rpc: RpcTokenHolding[],
  das: PortfolioTokenRow[] | null,
): PortfolioTokenRow[] {
  const map = new Map<string, PortfolioTokenRow>();
  for (const h of rpc) {
    map.set(h.mint, baseRowFromRpc(h));
  }
  if (!das?.length) return [...map.values()];

  for (const d of das) {
    const ex = map.get(d.mint);
    if (ex) {
      const decimalsMerged =
        ex.decimals > 0
          ? ex.decimals
          : d.decimals > 0
            ? d.decimals
            : ex.decimals;
      map.set(d.mint, {
        mint: d.mint,
        symbol: looksGoodSymbol(d.symbol) ? d.symbol : ex.symbol,
        name: looksGoodName(d.name) ? d.name : ex.name,
        amountRaw: ex.amountRaw,
        decimals: decimalsMerged,
        logoUri: d.logoUri ?? ex.logoUri,
        tokenProgram: ex.tokenProgram,
      });
    } else {
      map.set(d.mint, {
        mint: d.mint,
        symbol: d.symbol,
        name: d.name,
        amountRaw: d.amountRaw,
        decimals: d.decimals,
        logoUri: d.logoUri,
        tokenProgram: d.tokenProgram,
      });
    }
  }
  return [...map.values()];
}

export async function fetchHoldingsForOwner(
  network: NetworkId,
  ownerAddress: string,
  rpcUrlOverride?: string | null,
): Promise<RpcTokenHolding[]> {
  const conn = getConnection(network, rpcUrlOverride);
  return fetchRpcTokenHoldings(conn, new PublicKey(ownerAddress));
}
