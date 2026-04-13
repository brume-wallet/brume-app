import { type NetworkId } from "@brume/shared/constants";
import { corsHeaders, jsonResponse } from "@/lib/cors";
import { attachActivityLogos } from "@/lib/activity-logos";
import { fetchHeliusParsedActivity } from "@/lib/helius-parsed-activity";
import { fetchRpcEnrichedActivity } from "@/lib/rpc-activity-enrich";
import { getConnection } from "@/lib/rpc";
import {
  activityKey,
  ACTIVITY_TTL_SEC,
  cacheGet,
  cacheSet,
} from "@/lib/token-cache";

export const dynamic = "force-dynamic";

function isNetwork(s: string | null): s is NetworkId {
  return s === "devnet" || s === "mainnet-beta";
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ address: string }> },
) {
  const { address: addrRaw } = await ctx.params;
  const address = decodeURIComponent(addrRaw ?? "").trim();
  const url = new URL(req.url);
  const network = url.searchParams.get("network");
  const limit = Math.min(
    50,
    Math.max(1, Number.parseInt(url.searchParams.get("limit") ?? "20", 10) || 20),
  );
  const rpcUrlOverride = url.searchParams.get("rpcUrl")?.trim() || null;

  if (!address || !isNetwork(network)) {
    return jsonResponse(
      req,
      { error: "Missing or invalid address / network" },
      { status: 400 },
    );
  }

  const ak = activityKey(network, address, limit);
  const cached = await cacheGet<{
    items: unknown[];
    source: string;
  }>(ak);
  if (cached?.items?.length) {
    if (process.env.NODE_ENV === "development") {
      console.log("[activity] cache hit", network, address, {
        source: cached.source,
        items: cached.items.length,
      });
    }
    return jsonResponse(req, {
      items: cached.items,
      network,
      source: cached.source,
      cached: true,
    });
  }

  const apiKey = process.env.HELIUS_API_KEY?.trim();
  const conn = getConnection(network, rpcUrlOverride);

  let source: "helius" | "rpc" = "rpc";
  let rows: Awaited<ReturnType<typeof fetchRpcEnrichedActivity>> | Awaited<
    ReturnType<typeof fetchHeliusParsedActivity>
  >;

  if (apiKey) {
    try {
      const h = await fetchHeliusParsedActivity(apiKey, network, address, limit);
      if (h.length > 0) {
        rows = h;
        source = "helius";
      } else {
        rows = await fetchRpcEnrichedActivity(
          network,
          address,
          limit,
          rpcUrlOverride,
        );
      }
    } catch {
      rows = await fetchRpcEnrichedActivity(
        network,
        address,
        limit,
        rpcUrlOverride,
      );
    }
  } else {
    rows = await fetchRpcEnrichedActivity(
      network,
      address,
      limit,
      rpcUrlOverride,
    );
  }

  const items = await attachActivityLogos(network, conn, rows);

  const body = { items, network, source, cached: false };
  await cacheSet(ak, { items, source }, ACTIVITY_TTL_SEC);

  if (process.env.NODE_ENV === "development") {
    console.log("[activity] fresh", network, address, {
      source,
      items: items.length,
      helius: Boolean(apiKey),
    });
  }

  return jsonResponse(req, body);
}

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}
