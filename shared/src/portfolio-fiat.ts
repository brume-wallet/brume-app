import { JUPITER_SOL_PRICE_MINT } from "./jupiter-price";
import type { PortfolioTokenRow } from "./portfolio-types";

export function portfolioPriceMintList(
  tokens: readonly PortfolioTokenRow[] | undefined,
): string[] {
  const s = new Set<string>([JUPITER_SOL_PRICE_MINT]);
  for (const t of tokens ?? []) {
    if (t.mint) s.add(t.mint);
  }
  return [...s];
}

export function portfolioHoldingsKey(
  balanceSolBaseUnits: string | null | undefined,
  tokens: readonly PortfolioTokenRow[] | undefined,
): string {
  const sol = balanceSolBaseUnits ?? "";
  const rest = (tokens ?? [])
    .map((t) => `${t.mint}:${t.amountRaw}`)
    .sort()
    .join("|");
  return `${sol}#${rest}`;
}

export function uiAmountFromRaw(amountRaw: string, decimals: number): number {
  const raw = BigInt(amountRaw);
  const div = 10n ** BigInt(decimals);
  return Number(raw) / Number(div);
}

export function usdForHolding(
  amountRaw: string | null | undefined,
  decimals: number,
  usdPerToken: number | undefined,
): number | null {
  if (usdPerToken == null || !Number.isFinite(usdPerToken) || usdPerToken < 0) {
    return null;
  }
  if (amountRaw == null || amountRaw === "") return null;
  const ui = uiAmountFromRaw(amountRaw, decimals);
  if (!Number.isFinite(ui)) return null;
  return ui * usdPerToken;
}

export function totalPortfolioUsdApprox(args: {
  balanceSolBaseUnits: string | null | undefined;
  portfolioTokens: readonly PortfolioTokenRow[] | undefined;
  usdPerMint: ReadonlyMap<string, number>;
}): number {
  let sum = 0;
  const solP = args.usdPerMint.get(JUPITER_SOL_PRICE_MINT);
  const solUsd = usdForHolding(
    args.balanceSolBaseUnits ?? "",
    9,
    solP,
  );
  if (solUsd != null) sum += solUsd;
  for (const t of args.portfolioTokens ?? []) {
    const p = args.usdPerMint.get(t.mint);
    const u = usdForHolding(t.amountRaw, t.decimals, p);
    if (u != null) sum += u;
  }
  return sum;
}
