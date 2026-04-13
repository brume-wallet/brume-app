export type OriginDecision = "allowed" | "blocked" | "prompt";

export function validateOrigin(
  origin: string,
  allowlist: string[],
  blocklist: string[],
): OriginDecision {
  if (blocklist.includes(origin)) return "blocked";
  if (allowlist.includes(origin)) return "allowed";
  return "prompt";
}
