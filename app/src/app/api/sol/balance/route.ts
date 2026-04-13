import { PublicKey } from "@solana/web3.js";
import { type NetworkId } from "@brume/shared/constants";
import { corsHeaders, jsonResponse } from "@/lib/cors";
import { getConnection } from "@/lib/rpc";

export const dynamic = "force-dynamic";

function isNetwork(s: string | null): s is NetworkId {
  return s === "devnet" || s === "mainnet-beta";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const owner = url.searchParams.get("owner")?.trim();
  const network = url.searchParams.get("network");
  const rpcUrlOverride = url.searchParams.get("rpcUrl")?.trim() || null;

  if (!owner || !isNetwork(network)) {
    return jsonResponse(
      req,
      { error: "Missing or invalid owner / network" },
      { status: 400 },
    );
  }

  try {
    const conn = getConnection(network, rpcUrlOverride);
    const lamports = await conn.getBalance(new PublicKey(owner));
    return jsonResponse(req, { lamports: String(lamports) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonResponse(req, { error: msg }, { status: 502 });
  }
}

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}
