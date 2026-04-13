export interface PortfolioTokenRow {
  mint: string;
  symbol: string;
  name: string;
  amountRaw: string;
  decimals: number;
  logoUri: string | null;
  tokenProgram?: "token" | "token-2022";
}
