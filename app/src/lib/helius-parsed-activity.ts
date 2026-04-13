import type { NetworkId } from "@brume/shared/constants";
import {
  ACTIVITY_BURN_COUNTERPARTY,
  walletActivityDisplay,
  type ParsedActivityTxShape,
} from "@brume/shared/activity-format";
import { heliusParsedTxBase } from "./helius";

export interface HeliusIconSlot {
  kind: "sol" | "token";
  mint?: string;
}

function heliusPickIconSlots(
  tx: ParsedActivityTxShape,
  displayLabel: string,
): HeliusIconSlot[] {
  const label = displayLabel.toLowerCase();
  const mints = [
    ...new Set(
      (tx.tokenTransfers ?? [])
        .map((t) => t.mint)
        .filter((m): m is string => typeof m === "string" && m.length > 0),
    ),
  ];
  const hasSolMove = (tx.nativeTransfers ?? []).some((n) => {
    const a = Number(n.amount ?? 0);
    return Number.isFinite(a) && a !== 0;
  });

  if (label.includes("burn")) {
    const b = (tx.tokenTransfers ?? []).find(
      (t) =>
        t.toUserAccount === ACTIVITY_BURN_COUNTERPARTY &&
        (t.mint?.length ?? 0) > 0,
    );
    if (b?.mint) return [{ kind: "token", mint: b.mint }];
    const m = mints[0];
    if (m) return [{ kind: "token", mint: m }];
    return [];
  }

  if (label.includes("swap")) {
    if (hasSolMove && mints[0])
      return [{ kind: "sol" }, { kind: "token", mint: mints[0] }];
    if (mints.length >= 2)
      return [
        { kind: "token", mint: mints[0] },
        { kind: "token", mint: mints[1] },
      ];
    if (mints[0]) return [{ kind: "token", mint: mints[0] }];
    if (hasSolMove) return [{ kind: "sol" }];
    return [];
  }

  if (label.includes("sent") || label.includes("received")) {
    const m = mints[0];
    if (m) return [{ kind: "token", mint: m }];
    if (label.includes("sol")) return [{ kind: "sol" }];
  }

  if (mints[0]) return [{ kind: "token", mint: mints[0] }];
  return [];
}

interface ParsedTxJsonRow extends ParsedActivityTxShape {
  signature?: string;
  slot?: number;
  timestamp?: number;
  description?: string;
  type?: string;
  source?: string;
  transactionError?: { error?: string };
}

export interface HeliusActivityRow {
  signature: string;
  slot: number | null;
  err: unknown;
  blockTime: number | null;
  summary?: string;
  txType?: string | null;
  source?: string | null;
  displayLabel?: string;
  displayDetail?: string;
  iconSlots?: HeliusIconSlot[];
  enrichmentMints?: string[];
}

export function isWalletFocusedTx(tx: ParsedTxJsonRow): boolean {
  const t = (tx.type ?? "").toUpperCase();
  if (
    /^(NFT|CANDY|AUCTION|MARKETPLACE|LIST|BID|OFFER|STAKE|VOTE|COMPRESS|MINT_NFT|BURN_NFT|UPDATE_|SET_AUTHORITY|CREATE_POOL|WITHDRAW_GEM|CLAIM_|ENGLISH_AUCTION|LOAN|BORROW|LEND|PERP|OPEN_)/.test(
      t,
    )
  ) {
    return false;
  }
  if (/^UNKNOWN$/.test(t)) {
    const hasMove =
      (tx.nativeTransfers?.length ?? 0) > 0 ||
      (tx.tokenTransfers?.length ?? 0) > 0;
    return hasMove;
  }
  if (
    /TRANSFER|SWAP|CLOSE|TOKEN_BURN|\bBURN\b|TOKEN|SEND|RECEIVE|EXCHANGE|WITHDRAW|DEPOSIT|WRAP|UNWRAP|SOL_|SYSTEM_/.test(
      t,
    )
  ) {
    return true;
  }
  const hasMove =
    (tx.nativeTransfers?.length ?? 0) > 0 ||
    (tx.tokenTransfers?.length ?? 0) > 0;
  return hasMove;
}

export async function fetchHeliusParsedActivity(
  apiKey: string,
  network: NetworkId,
  address: string,
  limit: number,
): Promise<HeliusActivityRow[]> {
  const base = heliusParsedTxBase(network);
  if (!base) return [];

  const fetchCap = Math.min(100, Math.max(limit * 4, limit));
  const url = new URL(
    `${base}/v0/addresses/${encodeURIComponent(address)}/transactions`,
  );
  url.searchParams.set("api-key", apiKey);
  url.searchParams.set("limit", String(fetchCap));
  url.searchParams.set("sort-order", "desc");

  const res = await fetch(url.toString(), { method: "GET" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Activity indexer ${res.status}${text ? `: ${text.slice(0, 120)}` : ""}`,
    );
  }

  const data = (await res.json()) as ParsedTxJsonRow[];
  if (!Array.isArray(data)) return [];

  const filtered = data.filter(isWalletFocusedTx);

  return filtered
    .slice(0, limit)
    .map((tx) => {
      const err = tx.transactionError?.error ?? null;
      let displayLabel: string;
      let displayDetail: string;
      if (err != null && err !== "") {
        displayLabel = "Failed";
        displayDetail = err;
      } else {
        const d = walletActivityDisplay(tx, address, network);
        displayLabel = d.label;
        displayDetail = d.detail;
      }
      const iconSlots =
        err != null && err !== ""
          ? undefined
          : heliusPickIconSlots(tx, displayLabel);
      const enrichmentMints = new Set<string>();
      for (const tr of tx.tokenTransfers ?? []) {
        const m = tr.mint?.trim();
        if (m) enrichmentMints.add(m);
      }
      for (const s of iconSlots ?? []) {
        if (s.kind === "token" && s.mint?.trim()) enrichmentMints.add(s.mint.trim());
      }
      return {
        signature: tx.signature ?? "",
        slot: tx.slot ?? null,
        blockTime: tx.timestamp ?? null,
        err,
        summary: tx.description,
        txType: tx.type ?? null,
        source: tx.source ?? null,
        displayLabel,
        displayDetail,
        iconSlots,
        enrichmentMints:
          enrichmentMints.size > 0 ? [...enrichmentMints] : undefined,
      };
    })
    .filter((r) => r.signature.length > 0);
}
