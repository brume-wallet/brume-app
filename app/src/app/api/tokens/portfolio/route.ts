import { type NetworkId } from "@brume/shared/constants";
import { corsHeaders, jsonResponse } from "@/lib/cors";
import { heliusDasGetAssetsByOwner } from "@/lib/helius";
import { enrichPortfolioRows } from "@/lib/metadata-resolve";
import {
  fetchHoldingsForOwner,
  mergeDasAndRpcHoldings,
} from "@/lib/spl-portfolio";
import { getConnection } from "@/lib/rpc";
import { cacheGet, cacheSet, portfolioKey, PORTFOLIO_TTL_SEC } from "@/lib/token-cache";

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

  const pk = portfolioKey(network, owner);
  const cached = await cacheGet<{
    tokens: unknown;
    nativeLamports: string | null;
  }>(pk);
  if (cached?.tokens) {
    return jsonResponse(req, {
      tokens: cached.tokens,
      nativeLamports: cached.nativeLamports,
      cached: true,
    });
  }

  const apiKey = process.env.HELIUS_API_KEY?.trim();
  let dasTokens = null as Awaited<
    ReturnType<typeof heliusDasGetAssetsByOwner>
  >["tokens"] | null;
  let nativeFromDas: bigint | null = null;

  if (apiKey) {
    try {
      const d = await heliusDasGetAssetsByOwner(apiKey, network, owner);
      dasTokens = d.tokens;
      nativeFromDas = d.nativeLamports;
    } catch {
      /* DAS optional */
    }
  }

  const rpcHoldings = await fetchHoldingsForOwner(
    network,
    owner,
    rpcUrlOverride,
  );
  let merged = mergeDasAndRpcHoldings(rpcHoldings, dasTokens);
  const conn = getConnection(network, rpcUrlOverride);
  merged = await enrichPortfolioRows(network, conn, merged);

  const body = {
    tokens: merged,
    nativeLamports: nativeFromDas != null ? nativeFromDas.toString() : null,
    cached: false,
  };

  await cacheSet(pk, body, PORTFOLIO_TTL_SEC);

  return jsonResponse(req, body);
}

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}
