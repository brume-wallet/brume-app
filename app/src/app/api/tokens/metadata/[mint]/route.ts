import { type NetworkId } from "@brume/shared/constants";
import { corsHeaders, jsonResponse } from "@/lib/cors";
import { resolveTokenMetadata } from "@/lib/metadata-resolve";
import { getConnection } from "@/lib/rpc";

export const dynamic = "force-dynamic";

function isNetwork(s: string | null): s is NetworkId {
  return s === "devnet" || s === "mainnet-beta";
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ mint: string }> },
) {
  const { mint: mintRaw } = await ctx.params;
  const mint = decodeURIComponent(mintRaw ?? "").trim();
  const url = new URL(req.url);
  const network = url.searchParams.get("network");
  const rpcUrlOverride = url.searchParams.get("rpcUrl")?.trim() || null;

  if (!mint || !isNetwork(network)) {
    return jsonResponse(
      req,
      { error: "Missing or invalid mint / network" },
      { status: 400 },
    );
  }

  try {
    const conn = getConnection(network, rpcUrlOverride);
    const meta = await resolveTokenMetadata(network, mint, conn);
    return jsonResponse(req, meta);
  } catch (e) {
    return jsonResponse(
      req,
      { error: e instanceof Error ? e.message : "resolve failed" },
      { status: 500 },
    );
  }
}

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}
