import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { corsHeaders, isCorsOriginAllowed } from "@/lib/cors";

const WINDOW_MS = 60_000;
const MAX_REQ_PER_WINDOW = 180;

type Bucket = { count: number; windowStart: number };
const rateBuckets = new Map<string, Bucket>();

function clientKey(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  const first = fwd?.split(",")[0]?.trim();
  return (
    first ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

function allowRate(key: string): boolean {
  const now = Date.now();
  let b = rateBuckets.get(key);
  if (!b || now - b.windowStart > WINDOW_MS) {
    b = { count: 1, windowStart: now };
    rateBuckets.set(key, b);
    return true;
  }
  if (b.count >= MAX_REQ_PER_WINDOW) return false;
  b.count += 1;
  return true;
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && !isCorsOriginAllowed(request)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (!allowRate(clientKey(request))) {
    const h = new Headers(corsHeaders(request));
    h.set("Retry-After", "60");
    return new NextResponse("Too Many Requests", { status: 429, headers: h });
  }

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
  }

  const res = NextResponse.next();
  const cors = corsHeaders(request);
  Object.entries(cors).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export const config = {
  matcher: "/api/:path*",
};
