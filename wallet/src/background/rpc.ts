import { getAuthToken, verifyTeeRpcIntegrity } from "@magicblock-labs/ephemeral-rollups-sdk";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import nacl from "tweetnacl";
import {
  NETWORKS,
  SOL_BASE_UNITS_PER_SOL,
  SOL_WRAPPED_MINT,
  magicblockPerEphemeralSubmitHttp,
  type NetworkId,
} from "@/shared/constants";
import { base64ToBytes } from "@/shared/crypto";
import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createBurnCheckedInstruction,
  createCloseAccountInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
  tokenProgramPubkey,
  type TokenProgramKind,
} from "@/shared/spl-token-inline";
import {
  paymentsGetIsMintInitialized,
  paymentsGetPrivateBalance,
  paymentsGetSplBalance,
  paymentsPostInitializeMint,
  paymentsPostSplDeposit,
  paymentsPostSplTransfer,
  paymentsPostSplWithdraw,
  type UnsignedPaymentTransaction,
} from "./payments-api";

export function resolveRpcUrl(
  network: NetworkId,
  rpcUrlOverride?: string | null,
): string {
  const trimmed = rpcUrlOverride?.trim();
  if (trimmed) return trimmed;
  return NETWORKS[network].rpc;
}

export function getConnection(
  network: NetworkId,
  rpcUrlOverride?: string | null,
): Connection {
  const url = resolveRpcUrl(network, rpcUrlOverride);
  return new Connection(url, { commitment: "confirmed" });
}

export async function fetchSolBalanceBaseUnits(
  network: NetworkId,
  address: string,
  rpcUrlOverride?: string | null,
): Promise<bigint> {
  const conn = getConnection(network, rpcUrlOverride);
  const raw = await conn.getBalance(new PublicKey(address));
  return BigInt(raw);
}

export async function requestAirdropDevnet(
  network: NetworkId,
  publicKey: string,
  sol = 1,
  rpcUrlOverride?: string | null,
): Promise<string> {
  if (network !== "devnet") {
    throw new Error("Airdrop is only available on Devnet");
  }
  const conn = getConnection(network, rpcUrlOverride);
  const sig = await conn.requestAirdrop(
    new PublicKey(publicKey),
    Math.floor(sol * Number(SOL_BASE_UNITS_PER_SOL)),
  );
  const latest = await conn.getLatestBlockhash();
  await conn.confirmTransaction(
    { signature: sig, ...latest },
    "confirmed",
  );
  return sig;
}

export async function sendSol(params: {
  network: NetworkId;
  from: Keypair;
  toAddress: string;
  solAmount: number;
  rpcUrlOverride?: string | null;
}): Promise<string> {
  const conn = getConnection(params.network, params.rpcUrlOverride);
  const to = new PublicKey(params.toAddress);
  const transferBaseUnits = BigInt(
    Math.floor(params.solAmount * Number(SOL_BASE_UNITS_PER_SOL)),
  );
  if (transferBaseUnits <= 0n) throw new Error("Amount must be positive");

  const { blockhash, lastValidBlockHeight } =
    await conn.getLatestBlockhash();

  const tx = new Transaction({
    feePayer: params.from.publicKey,
    recentBlockhash: blockhash,
  }).add(
    SystemProgram.transfer({
      fromPubkey: params.from.publicKey,
      toPubkey: to,
      lamports: transferBaseUnits,
    }),
  );
  tx.sign(params.from);
  const raw = tx.serialize();
  const sig = await conn.sendRawTransaction(raw, {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });
  await conn.confirmTransaction(
    { signature: sig, blockhash, lastValidBlockHeight },
    "confirmed",
  );
  return sig;
}

function amountToApiNumber(raw: bigint): number {
  if (raw > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("Amount too large");
  }
  return Number(raw);
}

async function ephemeralAuthedConnection(
  network: NetworkId,
  signer: Keypair,
): Promise<Connection> {
  const rpcUrl = magicblockPerEphemeralSubmitHttp(network);
  const ok = await verifyTeeRpcIntegrity(rpcUrl);
  if (!ok) throw new Error("Ephemeral RPC integrity check failed");
  const { token } = await getAuthToken(
    rpcUrl,
    signer.publicKey,
    async (message) => nacl.sign.detached(message, signer.secretKey),
  );
  return new Connection(rpcUrl, {
    commitment: "confirmed",
    httpHeaders: { Authorization: `Bearer ${token}` },
  });
}

async function signAndSendLegacyPaymentTransaction(params: {
  network: NetworkId;
  rpcUrlOverride?: string | null;
  signer: Keypair;
  unsigned: UnsignedPaymentTransaction;
}): Promise<string> {
  const wire = base64ToBytes(params.unsigned.transactionBase64);
  const tx = Transaction.from(wire);
  tx.partialSign(params.signer);
  const raw = tx.serialize();

  const sendTo = params.unsigned.sendTo ?? "base";
  if (sendTo === "ephemeral") {
    const conn = await ephemeralAuthedConnection(params.network, params.signer);
    const sig = await conn.sendRawTransaction(raw, {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });
    const latest = await conn.getLatestBlockhash();
    await conn.confirmTransaction(
      { signature: sig, ...latest },
      "confirmed",
    );
    return sig;
  }

  const conn = getConnection(params.network, params.rpcUrlOverride);
  const sig = await conn.sendRawTransaction(raw, {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });
  await conn.confirmTransaction(
    {
      signature: sig,
      blockhash: params.unsigned.recentBlockhash,
      lastValidBlockHeight: params.unsigned.lastValidBlockHeight,
    },
    "confirmed",
  );
  return sig;
}

async function ensurePaymentsMintInitializedForSpl(p: {
  mintAddress: string;
  network: NetworkId;
  payerB58: string;
  signer: Keypair;
  rpcUrlOverride?: string | null;
}): Promise<void> {
  const ok = await paymentsGetIsMintInitialized(
    p.mintAddress,
    p.network,
    p.rpcUrlOverride,
  );
  if (ok) return;
  const initUnsigned = await paymentsPostInitializeMint({
    payer: p.payerB58,
    mint: p.mintAddress,
    network: p.network,
    rpcUrlOverride: p.rpcUrlOverride,
  });
  await signAndSendLegacyPaymentTransaction({
    network: p.network,
    rpcUrlOverride: p.rpcUrlOverride,
    signer: p.signer,
    unsigned: initUnsigned,
  });
}

// ---------------------------------------------------------------------------
// SOL send — try private wSOL on PER via Payments API, else standard SOL
// ---------------------------------------------------------------------------

export async function sendSolPreferMagicBlockPrivate(params: {
  network: NetworkId;
  from: Keypair;
  toAddress: string;
  solAmount: number;
  rpcUrlOverride?: string | null;
}): Promise<{ signature: string; route: "private" | "standard" }> {
  const lamports = BigInt(
    Math.floor(params.solAmount * Number(SOL_BASE_UNITS_PER_SOL)),
  );
  if (lamports <= 0n) throw new Error("Amount must be positive");

  const fromB58 = params.from.publicKey.toBase58();
  const toTrim = params.toAddress.trim();
  if (!toTrim) throw new Error("Recipient required");

  try {
    await ensurePaymentsMintInitializedForSpl({
      mintAddress: SOL_WRAPPED_MINT,
      network: params.network,
      payerB58: fromB58,
      signer: params.from,
      rpcUrlOverride: params.rpcUrlOverride,
    });

    const transferUnsigned = await paymentsPostSplTransfer({
      from: fromB58,
      to: toTrim,
      mint: SOL_WRAPPED_MINT,
      amount: amountToApiNumber(lamports),
      visibility: "private",
      fromBalance: "ephemeral",
      toBalance: "ephemeral",
      network: params.network,
      rpcUrlOverride: params.rpcUrlOverride,
    });

    const sig = await signAndSendLegacyPaymentTransaction({
      network: params.network,
      rpcUrlOverride: params.rpcUrlOverride,
      signer: params.from,
      unsigned: transferUnsigned,
    });
    return { signature: sig, route: "private" };
  } catch (e) {
    console.error("[Brume] Private SOL (wSOL) path failed, falling back", e);
    if (params.network === "devnet") {
      throw e instanceof Error ? e : new Error(String(e));
    }
    const sig = await sendSol({
      network: params.network,
      from: params.from,
      toAddress: params.toAddress,
      solAmount: params.solAmount,
      rpcUrlOverride: params.rpcUrlOverride,
    });
    return { signature: sig, route: "standard" };
  }
}

export function humanAmountToTokenRaw(
  amountStr: string,
  decimals: number,
): bigint {
  const t = amountStr.trim().replace(/,/g, "");
  if (!t || t === ".") throw new Error("Invalid amount");
  if (t.startsWith("-")) throw new Error("Invalid amount");
  const m = t.match(/^(\d*)(?:\.(\d+))?$/);
  if (!m) throw new Error("Invalid amount");
  const wi = m[1] || "0";
  let fr = m[2] || "";
  if (fr.length > decimals) fr = fr.slice(0, decimals);
  fr = fr.padEnd(decimals, "0");
  const whole = BigInt(wi || "0");
  const frac = decimals > 0 ? BigInt(fr || "0") : 0n;
  const scale = 10n ** BigInt(decimals);
  const out = whole * scale + frac;
  if (out <= 0n) throw new Error("Amount must be positive");
  return out;
}

export async function readMintForTransfer(
  conn: Connection,
  mint: PublicKey,
): Promise<{ decimals: number; tokenProgram: TokenProgramKind }> {
  const info = await conn.getAccountInfo(mint, "confirmed");
  if (!info) throw new Error("Mint not found");
  if (
    !info.owner.equals(TOKEN_PROGRAM_ID) &&
    !info.owner.equals(TOKEN_2022_PROGRAM_ID)
  ) {
    throw new Error("Not an SPL token mint");
  }
  const tokenProgram: TokenProgramKind = info.owner.equals(TOKEN_2022_PROGRAM_ID)
    ? "token-2022"
    : "token";
  const parsed = await conn.getParsedAccountInfo(mint);
  const data = parsed.value?.data;
  if (!data || !("parsed" in data) || data.parsed.type !== "mint") {
    throw new Error("Could not read mint");
  }
  const dec = (data.parsed.info as { decimals?: number }).decimals;
  if (typeof dec !== "number" || dec < 0 || dec > 18) {
    throw new Error("Invalid mint decimals");
  }
  return { decimals: dec, tokenProgram };
}

// ---------------------------------------------------------------------------
// SPL send — try private transfer via Payments API, fall back to standard
// ---------------------------------------------------------------------------

export async function sendSplPreferMagicBlockPrivate(params: {
  network: NetworkId;
  from: Keypair;
  toAddress: string;
  mintAddress: string;
  amountStr: string;
  rpcUrlOverride?: string | null;
}): Promise<{ signature: string; route: "private" | "standard" }> {
  const conn = getConnection(params.network, params.rpcUrlOverride);
  const mintPk = new PublicKey(params.mintAddress);
  const { decimals } = await readMintForTransfer(conn, mintPk);
  const amountRaw = humanAmountToTokenRaw(params.amountStr, decimals);
  const fromB58 = params.from.publicKey.toBase58();

  try {
    await ensurePaymentsMintInitializedForSpl({
      mintAddress: params.mintAddress,
      network: params.network,
      payerB58: fromB58,
      signer: params.from,
      rpcUrlOverride: params.rpcUrlOverride,
    });

    const transferUnsigned = await paymentsPostSplTransfer({
      from: fromB58,
      to: params.toAddress.trim(),
      mint: params.mintAddress,
      amount: amountToApiNumber(amountRaw),
      visibility: "private",
      fromBalance: "ephemeral",
      toBalance: "ephemeral",
      network: params.network,
      rpcUrlOverride: params.rpcUrlOverride,
    });

    const sig = await signAndSendLegacyPaymentTransaction({
      network: params.network,
      rpcUrlOverride: params.rpcUrlOverride,
      signer: params.from,
      unsigned: transferUnsigned,
    });
    return { signature: sig, route: "private" };
  } catch (e) {
    console.error("[Brume] Private SPL path failed, falling back", e);
    if (params.network === "devnet") {
      throw e instanceof Error ? e : new Error(String(e));
    }
    const sig = await sendSplToken({
      network: params.network,
      from: params.from,
      toAddress: params.toAddress,
      mintAddress: params.mintAddress,
      amountStr: params.amountStr,
      rpcUrlOverride: params.rpcUrlOverride,
    });
    return { signature: sig, route: "standard" };
  }
}

/**
 * Private send from shielded (ephemeral) balance to another user (ephemeral).
 */
export async function sendSplPrivateEphemeral(params: {
  network: NetworkId;
  from: Keypair;
  toAddress: string;
  mintAddress: string;
  amountStr: string;
  rpcUrlOverride?: string | null;
}): Promise<{ signature: string; route: "private" }> {
  const toTrim = params.toAddress.trim();
  if (!toTrim) throw new Error("Recipient required");
  const fromB58 = params.from.publicKey.toBase58();
  if (toTrim === fromB58) {
    throw new Error("Recipient must differ from your wallet");
  }

  const conn = getConnection(params.network, params.rpcUrlOverride);
  const mintPk = new PublicKey(params.mintAddress);
  const { decimals } = await readMintForTransfer(conn, mintPk);
  const amountRaw = humanAmountToTokenRaw(params.amountStr, decimals);

  const privStr = await paymentsGetPrivateBalance(
    fromB58,
    params.mintAddress,
    params.network,
    params.rpcUrlOverride,
  );
  const priv = BigInt(privStr);
  if (priv < amountRaw) {
    throw new Error("Insufficient shielded balance");
  }

  await ensurePaymentsMintInitializedForSpl({
    mintAddress: params.mintAddress,
    network: params.network,
    payerB58: fromB58,
    signer: params.from,
    rpcUrlOverride: params.rpcUrlOverride,
  });

  const transferUnsigned = await paymentsPostSplTransfer({
    from: fromB58,
    to: toTrim,
    mint: params.mintAddress,
    amount: amountToApiNumber(amountRaw),
    visibility: "private",
    fromBalance: "ephemeral",
    toBalance: "ephemeral",
    network: params.network,
    rpcUrlOverride: params.rpcUrlOverride,
  });

  const sig = await signAndSendLegacyPaymentTransaction({
    network: params.network,
    rpcUrlOverride: params.rpcUrlOverride,
    signer: params.from,
    unsigned: transferUnsigned,
  });
  return { signature: sig, route: "private" };
}

export async function sendSplToken(params: {
  network: NetworkId;
  from: Keypair;
  toAddress: string;
  mintAddress: string;
  amountStr: string;
  rpcUrlOverride?: string | null;
}): Promise<string> {
  const conn = getConnection(params.network, params.rpcUrlOverride);
  const mint = new PublicKey(params.mintAddress);
  const recipient = new PublicKey(params.toAddress);
  const owner = params.from.publicKey;
  const { decimals, tokenProgram } = await readMintForTransfer(conn, mint);
  const amountRaw = humanAmountToTokenRaw(params.amountStr, decimals);
  const programId = tokenProgramPubkey(tokenProgram);

  const sourceAta = getAssociatedTokenAddressSync(mint, owner, programId);
  const destAta = getAssociatedTokenAddressSync(mint, recipient, programId);

  const bal = await conn.getTokenAccountBalance(sourceAta);
  const have = BigInt(bal.value.amount);
  if (have < amountRaw) throw new Error("Insufficient token balance");

  const { blockhash, lastValidBlockHeight } =
    await conn.getLatestBlockhash();

  const tx = new Transaction({
    feePayer: owner,
    recentBlockhash: blockhash,
  });

  const destAcc = await conn.getAccountInfo(destAta, "confirmed");
  if (!destAcc) {
    tx.add(
      createAssociatedTokenAccountIdempotentInstruction(
        owner,
        destAta,
        recipient,
        mint,
        programId,
      ),
    );
  }

  tx.add(
    createTransferCheckedInstruction(
      sourceAta,
      mint,
      destAta,
      owner,
      amountRaw,
      decimals,
      programId,
    ),
  );

  tx.sign(params.from);
  const raw = tx.serialize();
  const sig = await conn.sendRawTransaction(raw, {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });
  await conn.confirmTransaction(
    { signature: sig, blockhash, lastValidBlockHeight },
    "confirmed",
  );
  return sig;
}

export type BurnSplTokenResult = {
  signature: string;
  mintAddress: string;
  burnAll: boolean;
  /** Smallest units remaining in the ATA; `null` when the ATA was closed. */
  remainingAmountRaw: string | null;
};

export async function burnSplToken(params: {
  network: NetworkId;
  from: Keypair;
  mintAddress: string;
  amountStr: string;
  rpcUrlOverride?: string | null;
}): Promise<BurnSplTokenResult> {
  const conn = getConnection(params.network, params.rpcUrlOverride);
  const mint = new PublicKey(params.mintAddress);
  const owner = params.from.publicKey;
  const { decimals, tokenProgram } = await readMintForTransfer(conn, mint);
  const programId = tokenProgramPubkey(tokenProgram);
  const sourceAta = getAssociatedTokenAddressSync(mint, owner, programId);

  const bal = await conn.getTokenAccountBalance(sourceAta);
  const have = BigInt(bal.value.amount);
  if (have <= 0n) throw new Error("No tokens to burn");

  const rawMode = params.amountStr.trim().toLowerCase();
  const burnAll = rawMode === "all" || rawMode === "*";

  let amountRaw: bigint;
  if (burnAll) {
    amountRaw = have;
  } else {
    amountRaw = humanAmountToTokenRaw(params.amountStr, decimals);
    if (amountRaw <= 0n) throw new Error("Amount must be positive");
    if (amountRaw > have) throw new Error("Insufficient token balance");
  }

  const { blockhash, lastValidBlockHeight } =
    await conn.getLatestBlockhash();

  const tx = new Transaction({
    feePayer: owner,
    recentBlockhash: blockhash,
  });

  tx.add(
    createBurnCheckedInstruction(
      sourceAta,
      mint,
      owner,
      amountRaw,
      decimals,
      programId,
    ),
  );

  if (burnAll) {
    tx.add(
      createCloseAccountInstruction(sourceAta, owner, owner, programId),
    );
  }

  tx.sign(params.from);
  const raw = tx.serialize();
  const sig = await conn.sendRawTransaction(raw, {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });
  await conn.confirmTransaction(
    { signature: sig, blockhash, lastValidBlockHeight },
    "confirmed",
  );
  return {
    signature: sig,
    mintAddress: params.mintAddress,
    burnAll,
    remainingAmountRaw: burnAll ? null : (have - amountRaw).toString(),
  };
}

// ---------------------------------------------------------------------------
// Shield balances — Payments API (base + ephemeral)
// ---------------------------------------------------------------------------

export async function fetchShieldBalanceInfo(params: {
  network: NetworkId;
  rpcUrlOverride?: string | null;
  ownerAddress: string;
  mintAddress: string;
}): Promise<{
  decimals: number;
  baseBalanceRaw: string;
  privateBalanceRaw: string;
}> {
  const conn = getConnection(params.network, params.rpcUrlOverride);
  const mintPk = new PublicKey(params.mintAddress);
  const { decimals } = await readMintForTransfer(conn, mintPk);
  const owner = params.ownerAddress.trim();

  const [baseBalanceRaw, privateBalanceRaw] = await Promise.all([
    paymentsGetSplBalance(
      owner,
      params.mintAddress,
      params.network,
      params.rpcUrlOverride,
    ).catch(() => "0"),
    paymentsGetPrivateBalance(
      owner,
      params.mintAddress,
      params.network,
      params.rpcUrlOverride,
    ).catch(() => "0"),
  ]);

  return {
    decimals,
    baseBalanceRaw,
    privateBalanceRaw,
  };
}

// ---------------------------------------------------------------------------
// Shield / unshield — Payments API
// ---------------------------------------------------------------------------

export async function shieldSplToken(params: {
  network: NetworkId;
  from: Keypair;
  mintAddress: string;
  amountStr: string;
  rpcUrlOverride?: string | null;
}): Promise<{ signature: string }> {
  const conn = getConnection(params.network, params.rpcUrlOverride);
  const mintPk = new PublicKey(params.mintAddress);
  const { decimals } = await readMintForTransfer(conn, mintPk);
  const amountRaw = humanAmountToTokenRaw(params.amountStr, decimals);
  if (amountRaw < 1n) {
    throw new Error("Amount must be at least one smallest unit");
  }

  const payerB58 = params.from.publicKey.toBase58();
  await ensurePaymentsMintInitializedForSpl({
    mintAddress: params.mintAddress,
    network: params.network,
    payerB58,
    signer: params.from,
    rpcUrlOverride: params.rpcUrlOverride,
  });

  const depositUnsigned = await paymentsPostSplDeposit({
    owner: payerB58,
    mint: params.mintAddress,
    amount: amountToApiNumber(amountRaw),
    network: params.network,
    rpcUrlOverride: params.rpcUrlOverride,
  });

  const sig = await signAndSendLegacyPaymentTransaction({
    network: params.network,
    rpcUrlOverride: params.rpcUrlOverride,
    signer: params.from,
    unsigned: depositUnsigned,
  });
  return { signature: sig };
}

export async function unshieldSplToken(params: {
  network: NetworkId;
  from: Keypair;
  mintAddress: string;
  amountStr: string;
  rpcUrlOverride?: string | null;
}): Promise<{ signature: string }> {
  const conn = getConnection(params.network, params.rpcUrlOverride);
  const mintPk = new PublicKey(params.mintAddress);
  const { decimals } = await readMintForTransfer(conn, mintPk);
  const amountRaw = humanAmountToTokenRaw(params.amountStr, decimals);
  if (amountRaw < 1n) {
    throw new Error("Amount must be at least one smallest unit");
  }

  const owner = params.from.publicKey.toBase58();
  const withdrawUnsigned = await paymentsPostSplWithdraw({
    owner,
    mint: params.mintAddress,
    amount: amountToApiNumber(amountRaw),
    network: params.network,
    rpcUrlOverride: params.rpcUrlOverride,
  });

  const sig = await signAndSendLegacyPaymentTransaction({
    network: params.network,
    rpcUrlOverride: params.rpcUrlOverride,
    signer: params.from,
    unsigned: withdrawUnsigned,
  });
  return { signature: sig };
}

export function deserializeTransaction(
  bytes: Uint8Array,
): Transaction | VersionedTransaction {
  try {
    return VersionedTransaction.deserialize(bytes);
  } catch {
    return Transaction.from(bytes);
  }
}

export async function signTransactionBytes(
  bytes: Uint8Array,
  signer: Keypair,
): Promise<Uint8Array> {
  const tx = deserializeTransaction(bytes);
  if (tx instanceof VersionedTransaction) {
    tx.sign([signer]);
    return tx.serialize();
  }
  tx.partialSign(signer);
  return tx.serialize();
}

export async function signAllTransactionBytes(
  list: Uint8Array[],
  signer: Keypair,
): Promise<Uint8Array[]> {
  const out: Uint8Array[] = [];
  for (const b of list) {
    out.push(await signTransactionBytes(b, signer));
  }
  return out;
}

/** Off-chain message signature (raw bytes), detached Ed25519. */
export function signMessageBytes(message: Uint8Array, signer: Keypair): Uint8Array {
  return nacl.sign.detached(message, signer.secretKey);
}

export async function getRecentSignatures(
  network: NetworkId,
  address: string,
  limit = 15,
  rpcUrlOverride?: string | null,
): Promise<
  Array<{
    signature: string;
    slot: number | null;
    err: unknown;
    blockTime: number | null;
  }>
> {
  const conn = getConnection(network, rpcUrlOverride);
  const rows = await conn.getSignaturesForAddress(new PublicKey(address), {
    limit,
  });
  return rows.map((s) => ({
    signature: s.signature,
    slot: s.slot ?? null,
    err: s.err,
    blockTime: s.blockTime ?? null,
  }));
}
