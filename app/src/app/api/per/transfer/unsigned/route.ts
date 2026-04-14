import { PublicKey } from "@solana/web3.js";
import {
  MAGICBLOCK_PAYMENTS_API_BASE_URL,
  normalizeUnsignedPaymentTransaction,
  paymentsClusterForNetwork,
  type NetworkId,
} from "@brume/shared";
import { corsHeaders, jsonResponse } from "@/lib/cors";

export const dynamic = "force-dynamic";

function isNetwork(s: unknown): s is NetworkId {
  return s === "devnet" || s === "mainnet-beta";
}

function paymentsApiBase(): string {
  const fromEnv = process.env.MAGICBLOCK_PAYMENTS_API_BASE_URL?.trim();
  return (fromEnv || MAGICBLOCK_PAYMENTS_API_BASE_URL).replace(/\/+$/, "");
}

function paymentsErrorMessage(data: unknown): string {
  if (!data || typeof data !== "object") return "Payments API error";
  const o = data as { error?: unknown };
  const e = o.error;
  if (typeof e === "string" && e.trim()) return e.trim();
  if (e && typeof e === "object") {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m.trim();
  }
  return "Payments API error";
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse(req, { error: "Invalid JSON body" }, { status: 400 });
  }

  const from = typeof body.from === "string" ? body.from.trim() : "";
  const to = typeof body.to === "string" ? body.to.trim() : "";
  const mint = typeof body.mint === "string" ? body.mint.trim() : "";
  const network = body.network;
  const rpcUrl =
    typeof body.rpcUrl === "string" ? body.rpcUrl.trim() || null : null;

  const amountRaw = body.amount;
  const amount =
    typeof amountRaw === "number"
      ? amountRaw
      : typeof amountRaw === "string" && amountRaw.trim() !== ""
        ? Number(amountRaw)
        : NaN;

  if (!from || !to || !mint || !isNetwork(network)) {
    return jsonResponse(
      req,
      { error: "Missing or invalid from, to, mint, or network" },
      { status: 400 },
    );
  }

  if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
    return jsonResponse(
      req,
      { error: "amount must be a positive integer (smallest units)" },
      { status: 400 },
    );
  }

  if (amount > Number.MAX_SAFE_INTEGER) {
    return jsonResponse(req, { error: "amount too large" }, { status: 400 });
  }

  try {
    new PublicKey(from);
    new PublicKey(to);
    new PublicKey(mint);
  } catch {
    return jsonResponse(req, { error: "Invalid pubkey" }, { status: 400 });
  }

  const cluster = rpcUrl || paymentsClusterForNetwork(network);

  const visibility =
    body.visibility === "public" || body.visibility === "private"
      ? body.visibility
      : ("private" as const);
  const fromBalance =
    body.fromBalance === "base" || body.fromBalance === "ephemeral"
      ? body.fromBalance
      : ("ephemeral" as const);
  const toBalance =
    body.toBalance === "base" || body.toBalance === "ephemeral"
      ? body.toBalance
      : ("ephemeral" as const);

  const transferBody: Record<string, unknown> = {
    from,
    to,
    mint,
    amount,
    cluster,
    visibility,
    fromBalance,
    toBalance,
    initIfMissing: true,
    initAtasIfMissing: true,
    initVaultIfMissing: true,
  };

  const validator = process.env.MAGICBLOCK_PAYMENTS_VALIDATOR?.trim();
  if (validator) transferBody.validator = validator;

  const apiBase = paymentsApiBase();
  const res = await fetch(`${apiBase}/v1/spl/transfer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(transferBody),
  });

  const text = await res.text();
  let data: unknown = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    return jsonResponse(
      req,
      { error: "Payments API returned invalid JSON" },
      { status: 502 },
    );
  }

  if (!res.ok) {
    return jsonResponse(
      req,
      { error: paymentsErrorMessage(data) },
      { status: res.status >= 400 && res.status < 600 ? res.status : 502 },
    );
  }

  try {
    const unsigned = normalizeUnsignedPaymentTransaction(data);
    return jsonResponse(req, unsigned);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonResponse(
      req,
      { error: msg },
      { status: 502 },
    );
  }
}

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}
