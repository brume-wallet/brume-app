const ALLOWED_ORIGIN_PATTERNS = [
  /^chrome-extension:\/\//,
  /^https:\/\/brume\.cash$/,
  /^https:\/\/.*\.vercel\.app$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];

// 
// Echo origin only for Brume extension / known hosts — never use wildcard.

export function resolveAllowedOrigin(request: Request): string | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  if (ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin))) return origin;
  if (origin.startsWith("chrome-extension://")) return origin;
  return null;
}

export function isCorsOriginAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return resolveAllowedOrigin(request) === origin;
}

export function corsHeaders(req: Request): HeadersInit {
  const allow = resolveAllowedOrigin(req);
  const base: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
  if (allow) {
    base["Access-Control-Allow-Origin"] = allow;
  }
  return base;
}

export function jsonResponse(
  req: Request,
  data: unknown,
  init?: ResponseInit,
): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(req),
      ...(init?.headers as Record<string, string>),
    },
  });
}
