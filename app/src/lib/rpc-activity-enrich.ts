import {
  Connection,
  PublicKey,
  type ParsedTransactionWithMeta,
} from "@solana/web3.js";
import type { NetworkId } from "@brume/shared/constants";
import {
  ACTIVITY_BURN_COUNTERPARTY,
  walletActivityDisplay,
  type ParsedActivityTxShape,
} from "@brume/shared/activity-format";
import { knownTokenSymbol } from "@brume/shared/known-tokens";
import { getConnection } from "./rpc";

export interface ActivityIconSlot {
  kind: "sol" | "token";
  mint?: string;
}

export interface ActivityRow {
  signature: string;
  slot: number | null;
  err: unknown;
  blockTime: number | null;
  summary?: string;
  txType?: string | null;
  source?: string | null;
  displayLabel?: string;
  displayDetail?: string;
  iconSlots?: ActivityIconSlot[];
    // Mints referenced in this tx (for activity copy + logo resolution).

  enrichmentMints?: string[];
}

// Common routers / aggregators (base58 program id).

const DEX_PROGRAM_LABELS: Record<string, string> = {
  JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4: "Jupiter",
  JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB: "Jupiter",
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8": "Raydium",
  whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc: "Orca",
  CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK: "Raydium CLMM",
  "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P": "Pump.fun",
  pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA: "Pump.fun",
};

const PARSE_DELAY_MS = 360;
const PARSE_RETRIES = 5;
const MAX_FULL_PARSE = 16;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isRateLimitedError(e: unknown): boolean {
  const s = e instanceof Error ? e.message : String(e);
  return /\b429\b|Too many requests|rate limit|for a specific RPC call/i.test(s);
}

type TxMeta = NonNullable<ParsedTransactionWithMeta["meta"]>;

async function fetchParsedTransactionThrottled(
  conn: Connection,
  signature: string,
): Promise<ParsedTransactionWithMeta | null> {
  for (let attempt = 0; attempt < PARSE_RETRIES; attempt++) {
    try {
      return await conn.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      });
    } catch (e) {
      if (!isRateLimitedError(e) || attempt === PARSE_RETRIES - 1) {
        return null;
      }
      await sleep(450 * 2 ** attempt);
    }
  }
  return null;
}

function shortPk(pk: string, head = 4, tail = 4): string {
  if (!pk || pk.length <= head + tail + 1) return pk || "—";
  return `${pk.slice(0, head)}…${pk.slice(-tail)}`;
}

function formatSignedRaw(delta: bigint, decimals: number): string {
  const neg = delta < 0n;
  const abs = neg ? -delta : delta;
  const n = Number(abs) / 10 ** decimals;
  if (!Number.isFinite(n)) return (neg ? "-" : "+") + abs.toString();
  const s = n >= 1 ? n.toFixed(4) : n.toFixed(6);
  const trimmed = s.replace(/\.?0+$/, "");
  return (neg ? "-" : "+") + trimmed;
}

function accountKeys(tx: {
  transaction: { message: { accountKeys: { pubkey: PublicKey }[] } };
}): PublicKey[] {
  return tx.transaction.message.accountKeys.map((a) => a.pubkey);
}

function tokenAccountOwner(
  meta: TxMeta,
  keys: PublicKey[],
  tokenAccount: string,
): string | null {
  const idx = keys.findIndex((k) => k.toBase58() === tokenAccount);
  if (idx < 0) return null;
  const bal =
    meta.postTokenBalances?.find((b) => b.accountIndex === idx) ??
    meta.preTokenBalances?.find((b) => b.accountIndex === idx);
  return bal?.owner ?? null;
}

function mintForTokenAccount(
  meta: TxMeta,
  keys: PublicKey[],
  tokenAccount: string,
): string | null {
  const idx = keys.findIndex((k) => k.toBase58() === tokenAccount);
  if (idx < 0) return null;
  const bal =
    meta.postTokenBalances?.find((b) => b.accountIndex === idx) ??
    meta.preTokenBalances?.find((b) => b.accountIndex === idx);
  return bal?.mint ?? null;
}

function decimalsForTokenAccount(
  meta: TxMeta,
  keys: PublicKey[],
  tokenAccount: string,
): number {
  const idx = keys.findIndex((k) => k.toBase58() === tokenAccount);
  if (idx < 0) return 0;
  const bal =
    meta.postTokenBalances?.find((b) => b.accountIndex === idx) ??
    meta.preTokenBalances?.find((b) => b.accountIndex === idx);
  return bal?.uiTokenAmount.decimals ?? 0;
}

function txHasWalletSplBurn(
  tx: ParsedTransactionWithMeta,
  wallet: string,
): boolean {
  const meta = tx.meta;
  const keys = accountKeys(tx);
  for (const ix of eachParsedIx(tx)) {
    if (ix.program !== "spl-token" && ix.program !== "spl-token-2022")
      continue;
    const p = ix.parsed as { type?: string; info?: Record<string, unknown> };
    if (p.type !== "burn" && p.type !== "burnChecked") continue;
    const info = p.info ?? {};
    const authority = String(info.authority ?? info.owner ?? "");
    if (authority === wallet) return true;
    const sourceAccount = String(info.account ?? "");
    if (meta && sourceAccount) {
      const owner = tokenAccountOwner(meta, keys, sourceAccount);
      if (owner === wallet) return true;
    }
  }
  return false;
}

function* eachParsedIx(tx: ParsedTransactionWithMeta) {
  const msg = tx.transaction.message;
  for (const ix of msg.instructions) {
    if ("parsed" in ix && ix.parsed) yield ix;
  }
  for (const group of tx.meta?.innerInstructions ?? []) {
    for (const ix of group.instructions) {
      if ("parsed" in ix && ix.parsed) yield ix;
    }
  }
}

function detectDexLabel(tx: ParsedTransactionWithMeta): string | null {
  const seen = new Set<string>();
  for (const ix of tx.transaction.message.instructions) {
    const id = ix.programId.toBase58();
    if (seen.has(id)) continue;
    seen.add(id);
    const label = DEX_PROGRAM_LABELS[id];
    if (label) return label;
  }
  for (const group of tx.meta?.innerInstructions ?? []) {
    for (const ix of group.instructions) {
      if (!("programId" in ix)) continue;
      const id = ix.programId.toBase58();
      if (seen.has(id)) continue;
      seen.add(id);
      const label = DEX_PROGRAM_LABELS[id];
      if (label) return label;
    }
  }
  return null;
}

function aggregateWalletTokenDeltas(
  meta: TxMeta,
  wallet: string,
): Map<string, { delta: bigint; decimals: number }> {
  const byMint = new Map<string, { delta: bigint; decimals: number }>();

  type Row = NonNullable<typeof meta.preTokenBalances>[number];
  const byIndex = (rows: Row[] | null | undefined) => {
    const m = new Map<number, Row>();
    for (const r of rows ?? []) {
      if (r.owner === wallet) m.set(r.accountIndex, r);
    }
    return m;
  };

  const preM = byIndex(meta.preTokenBalances);
  const postM = byIndex(meta.postTokenBalances);
  const indices = new Set([...preM.keys(), ...postM.keys()]);

  for (const idx of indices) {
    const pre = preM.get(idx);
    const post = postM.get(idx);
    const mint = post?.mint ?? pre?.mint;
    if (!mint) continue;
    const dec = post?.uiTokenAmount.decimals ?? pre?.uiTokenAmount.decimals ?? 0;
    const preRaw = BigInt(pre?.uiTokenAmount.amount ?? "0");
    const postRaw = BigInt(post?.uiTokenAmount.amount ?? "0");
    const delta = postRaw - preRaw;
    if (delta === 0n) continue;
    const cur = byMint.get(mint) ?? { delta: 0n, decimals: dec };
    byMint.set(mint, {
      delta: cur.delta + delta,
      decimals: dec,
    });
  }
  return byMint;
}

function walletSolLamportDelta(
  meta: TxMeta,
  keys: PublicKey[],
  wallet: string,
): number {
  let d = 0;
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].toBase58() !== wallet) continue;
    const pre = meta.preBalances[i] ?? 0;
    const post = meta.postBalances[i] ?? 0;
    d += post - pre;
  }
  return d;
}

function swapDescriptionFromDeltas(
  args: {
    tokenByMint: Map<string, { delta: bigint; decimals: number }>;
    solLamports: number;
  },
  network: NetworkId,
): string {
  const parts: string[] = [];
  if (args.solLamports !== 0) {
    parts.push(formatSignedRaw(BigInt(args.solLamports), 9) + " SOL");
  }
  for (const [mint, { delta, decimals }] of args.tokenByMint) {
    if (delta === 0n) continue;
    const sym = knownTokenSymbol(mint, network) ?? shortPk(mint, 4, 4);
    parts.push(`${formatSignedRaw(delta, decimals)} ${sym}`);
  }
  return parts.join(" · ") || "Exchanged tokens";
}

function isLikelySwap(
  tokenByMint: Map<string, { delta: bigint; decimals: number }>,
  solLamports: number,
): boolean {
  let pos = 0;
  let neg = 0;
  if (solLamports > 0) pos++;
  if (solLamports < 0) neg++;
  for (const { delta } of tokenByMint.values()) {
    if (delta > 0n) pos++;
    else if (delta < 0n) neg++;
  }
  return pos >= 1 && neg >= 1;
}

function buildShapeFromParsedTx(
  tx: ParsedTransactionWithMeta,
  wallet: string,
  network: NetworkId,
): ParsedActivityTxShape {
  const meta = tx.meta;
  const keys = accountKeys(tx);
  const nativeTransfers: ParsedActivityTxShape["nativeTransfers"] = [];
  const tokenTransfers: ParsedActivityTxShape["tokenTransfers"] = [];

  if (meta) {
    const walletBurned = txHasWalletSplBurn(tx, wallet);
    const solDelta = walletSolLamportDelta(meta, keys, wallet);
    const tokenDeltas = aggregateWalletTokenDeltas(meta, wallet);
    const dex = detectDexLabel(tx);

    if (
      !walletBurned &&
      (isLikelySwap(tokenDeltas, solDelta) ||
        (dex != null && tokenDeltas.size >= 1 && solDelta !== 0))
    ) {
      return {
        type: "SWAP",
        description: dex
          ? `${dex} · ${swapDescriptionFromDeltas(
              {
                tokenByMint: tokenDeltas,
                solLamports: solDelta,
              },
              network,
            )}`
          : swapDescriptionFromDeltas(
              {
                tokenByMint: tokenDeltas,
                solLamports: solDelta,
              },
              network,
            ),
      };
    }
  }

  for (const ix of eachParsedIx(tx)) {
    const p = ix.parsed as { type?: string; info?: Record<string, unknown> };
    const typ = p.type;
    const info = p.info ?? {};

    if (ix.program === "system" && typ === "transfer") {
      const src = String(info.source ?? "");
      const dst = String(info.destination ?? "");
      const lamports = Number(info.lamports ?? 0);
      if (!Number.isFinite(lamports) || lamports === 0) continue;
      if (src === wallet || dst === wallet) {
        nativeTransfers.push({
          fromUserAccount: src,
          toUserAccount: dst,
          amount: lamports,
        });
      }
    }

    if (ix.program === "spl-token" || ix.program === "spl-token-2022") {
      if (typ === "burn" || typ === "burnChecked") {
        const sourceAccount = String(info.account ?? "");
        const authority = String(info.authority ?? info.owner ?? "");
        let mintStr = String(info.mint ?? "");
        if (!mintStr && meta) {
          mintStr = mintForTokenAccount(meta, keys, sourceAccount) ?? "";
        }
        const sourceOwner =
          meta != null ? tokenAccountOwner(meta, keys, sourceAccount) : null;
        if (authority !== wallet && sourceOwner !== wallet) continue;

        let rawStr: string | undefined;
        let decimals: number | undefined;
        if (typ === "burnChecked") {
          rawStr = String(info.amount ?? "");
          decimals = Number(info.decimals ?? 0);
        } else {
          rawStr = String(info.amount ?? "");
          if (meta) {
            decimals = decimalsForTokenAccount(meta, keys, sourceAccount);
          }
        }
        const sym =
          knownTokenSymbol(mintStr, network) ??
          (mintStr ? shortPk(mintStr, 4, 4) : "Token");
        tokenTransfers.push({
          fromUserAccount: wallet,
          toUserAccount: ACTIVITY_BURN_COUNTERPARTY,
          mint: mintStr || undefined,
          tokenSymbol: sym,
          rawTokenAmount:
            rawStr != null && rawStr !== ""
              ? { tokenAmount: rawStr, decimals: decimals ?? 0 }
              : undefined,
        });
        continue;
      }

      if (typ !== "transfer" && typ !== "transferChecked") continue;
      const destination = String(info.destination ?? "");
      const authority = String(info.authority ?? info.owner ?? "");
      const mint = String(info.mint ?? "");

      let rawStr: string | undefined;
      let decimals: number | undefined;
      if (typ === "transferChecked") {
        rawStr = String(info.amount ?? "");
        decimals = Number(info.decimals ?? 0);
      } else {
        rawStr = String(info.amount ?? "");
      }

      const destOwner =
        meta != null ? tokenAccountOwner(meta, keys, destination) : null;

      let resolvedMint = mint;
      if (!resolvedMint && meta) {
        resolvedMint =
          mintForTokenAccount(meta, keys, destination) ??
          mintForTokenAccount(meta, keys, String(info.source ?? "")) ??
          "";
      }
      const sym =
        knownTokenSymbol(resolvedMint, network) ??
        (resolvedMint ? shortPk(resolvedMint, 4, 4) : "Token");

      if (authority === wallet && destOwner && destOwner !== wallet) {
        tokenTransfers.push({
          fromUserAccount: wallet,
          toUserAccount: destOwner,
          mint: resolvedMint || undefined,
          tokenSymbol: sym,
          rawTokenAmount:
            rawStr != null && rawStr !== ""
              ? { tokenAmount: rawStr, decimals: decimals ?? 0 }
              : undefined,
        });
      } else if (destOwner === wallet && authority && authority !== wallet) {
        tokenTransfers.push({
          fromUserAccount: authority,
          toUserAccount: wallet,
          mint: resolvedMint || undefined,
          tokenSymbol: sym,
          rawTokenAmount:
            rawStr != null && rawStr !== ""
              ? { tokenAmount: rawStr, decimals: decimals ?? 0 }
              : undefined,
        });
      }
    }
  }

  return { nativeTransfers, tokenTransfers };
}

function pickActivityIconSlots(
  parsed: ParsedTransactionWithMeta | null,
  wallet: string,
  displayLabel: string,
  shape: ParsedActivityTxShape,
): ActivityIconSlot[] {
  if (!parsed?.meta) return [];
  const label = displayLabel.toLowerCase();
  const keys = accountKeys(parsed);
  const solD = walletSolLamportDelta(parsed.meta, keys, wallet);
  const tokD = aggregateWalletTokenDeltas(parsed.meta, wallet);
  const entries = [...tokD.entries()].sort((a, b) => {
    const da = a[1].delta < 0n ? -a[1].delta : a[1].delta;
    const db = b[1].delta < 0n ? -b[1].delta : b[1].delta;
    return da === db ? 0 : db > da ? 1 : -1;
  });

  if (label.includes("swap")) {
    if (solD !== 0) {
      const top = entries[0]?.[0];
      if (top) return [{ kind: "sol" }, { kind: "token", mint: top }];
      return [{ kind: "sol" }];
    }
    const a = entries[0]?.[0];
    const b = entries[1]?.[0];
    if (a && b) return [{ kind: "token", mint: a }, { kind: "token", mint: b }];
    if (a) return [{ kind: "token", mint: a }];
    return [];
  }

  if (label.includes("burn")) {
    const b = shape.tokenTransfers?.find(
      (t) =>
        t.toUserAccount === ACTIVITY_BURN_COUNTERPARTY &&
        (t.mint?.length ?? 0) > 0,
    );
    if (b?.mint) return [{ kind: "token", mint: b.mint }];
    const burnMint = entries.find(([, v]) => v.delta < 0n)?.[0];
    if (burnMint) return [{ kind: "token", mint: burnMint }];
  }

  const sentOrRecv = label.includes("sent") || label.includes("received");
  if (sentOrRecv) {
    const mintFromShape = shape.tokenTransfers?.find((t) => t.mint)?.mint;
    if (mintFromShape)
      return [{ kind: "token", mint: mintFromShape }];
    if (label.includes("sol")) return [{ kind: "sol" }];
    const m = entries[0]?.[0];
    if (m) return [{ kind: "token", mint: m }];
  }

  if (label.includes("failed") || label.includes("app interaction")) return [];

  if (entries.length >= 1 && solD === 0) {
    const m = entries[0]![0];
    return [{ kind: "token", mint: m }];
  }

  return [];
}

function firstAppProgramLabel(tx: ParsedTransactionWithMeta): string | null {
  const system = "11111111111111111111111111111112";
  for (const ix of tx.transaction.message.instructions) {
    const id = ix.programId.toBase58();
    if (id === system) continue;
    return DEX_PROGRAM_LABELS[id] ?? shortPk(id, 4, 4);
  }
  return null;
}

function rowFromParsed(
  sig: {
    signature: string;
    slot: number | null;
    err: unknown;
    blockTime: number | null;
  },
  parsed: ParsedTransactionWithMeta | null,
  wallet: string,
  network: NetworkId,
  parseSkipped?: boolean,
): ActivityRow {
  if (sig.err) {
    return {
      ...sig,
      displayLabel: "Failed",
      displayDetail:
        typeof sig.err === "object" && sig.err && "InstructionError" in sig.err
          ? "Transaction error"
          : String(sig.err),
    };
  }

  if (!parsed?.meta) {
    return {
      ...sig,
      displayLabel: "Transaction",
      displayDetail: parseSkipped
        ? "Skipped detail fetch to stay under RPC limits · use a dedicated RPC in Settings if needed"
        : "Could not load details from RPC",
    };
  }

  const metaErr = parsed.meta.err;
  if (metaErr) {
    return {
      ...sig,
      displayLabel: "Failed",
      displayDetail:
        typeof metaErr === "string"
          ? metaErr
          : JSON.stringify(metaErr).slice(0, 120),
    };
  }

  const shape = buildShapeFromParsedTx(parsed, wallet, network);
  let { label, detail } = walletActivityDisplay(shape, wallet, network);

  if (label === "Transaction" && detail.includes("explorer")) {
    const keys = accountKeys(parsed);
    const solDelta = walletSolLamportDelta(parsed.meta, keys, wallet);
    const tokenDeltas = aggregateWalletTokenDeltas(parsed.meta, wallet);
    if (solDelta !== 0 || tokenDeltas.size > 0) {
      if (
        !txHasWalletSplBurn(parsed, wallet) &&
        isLikelySwap(tokenDeltas, solDelta)
      ) {
        const dex = detectDexLabel(parsed);
        label = "Swap";
        detail = dex
          ? `${dex} · ${swapDescriptionFromDeltas(
              {
                tokenByMint: tokenDeltas,
                solLamports: solDelta,
              },
              network,
            )}`
          : swapDescriptionFromDeltas(
              {
                tokenByMint: tokenDeltas,
                solLamports: solDelta,
              },
              network,
            );
      } else if (solDelta !== 0 && tokenDeltas.size === 0) {
        label = solDelta > 0 ? "Received SOL" : "Sent SOL";
        const amt = formatSignedRaw(BigInt(Math.abs(solDelta)), 9).replace(
          /^\+/,
          "",
        );
        detail =
          solDelta > 0
            ? `Net · ${amt} SOL`
            : `Net · ${amt} SOL (may include fees)`;
      } else if (tokenDeltas.size === 1 && solDelta === 0) {
        const [mint, { delta, decimals }] = [...tokenDeltas.entries()][0]!;
        const sym =
          knownTokenSymbol(mint, network) ?? shortPk(mint, 4, 4);
        label = delta > 0n ? `Received ${sym}` : `Sent ${sym}`;
        detail = `${formatSignedRaw(delta, decimals)} ${sym}`;
      }
    }
  }

  if (label === "Transaction" && detail.includes("explorer")) {
    const app = firstAppProgramLabel(parsed);
    if (app) {
      label = "App interaction";
      detail = app;
    }
  }

  const iconSlots = pickActivityIconSlots(parsed, wallet, label, shape);

  const enrichmentMints = new Set<string>();
  for (const t of shape.tokenTransfers ?? []) {
    const m = t.mint?.trim();
    if (m) enrichmentMints.add(m);
  }
  for (const s of iconSlots ?? []) {
    if (s.kind === "token" && s.mint?.trim()) enrichmentMints.add(s.mint.trim());
  }
  const tokD = aggregateWalletTokenDeltas(parsed.meta, wallet);
  for (const m of tokD.keys()) {
    if (m.trim()) enrichmentMints.add(m.trim());
  }

  return {
    ...sig,
    displayLabel: label,
    displayDetail: detail,
    iconSlots,
    enrichmentMints:
      enrichmentMints.size > 0 ? [...enrichmentMints] : undefined,
  };
}

export async function fetchRpcEnrichedActivity(
  network: NetworkId,
  address: string,
  limit: number,
  rpcUrlOverride?: string | null,
): Promise<ActivityRow[]> {
  const conn = getConnection(network, rpcUrlOverride);
  const pubkey = new PublicKey(address);
  const sigRows = await conn.getSignaturesForAddress(pubkey, { limit });
  if (sigRows.length === 0) return [];

  const parseCap = Math.min(limit, MAX_FULL_PARSE);
  const parsedChunks: (ParsedTransactionWithMeta | null)[] = [];

  for (let i = 0; i < sigRows.length; i++) {
    if (i >= parseCap) {
      parsedChunks.push(null);
      continue;
    }
    if (i > 0) await sleep(PARSE_DELAY_MS);
    const tx = await fetchParsedTransactionThrottled(conn, sigRows[i]!.signature);
    parsedChunks.push(tx);
  }

  return sigRows.map((s, i) =>
    rowFromParsed(
      {
        signature: s.signature,
        slot: s.slot ?? null,
        err: s.err,
        blockTime: s.blockTime ?? null,
      },
      parsedChunks[i] ?? null,
      address,
      network,
      i >= parseCap,
    ),
  );
}
