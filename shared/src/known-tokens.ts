import type { NetworkId } from "./constants";

const MAINNET: Record<string, string> = {
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: "USDC",
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: "USDT",
  So11111111111111111111111111111111111111112: "SOL",
};

const DEVNET: Record<string, string> = {
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU": "USDC",
  Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuS9GkuVFyiMKbPd: "USDT",
  So11111111111111111111111111111111111111112: "SOL",
};

const BY_NETWORK: Record<NetworkId, Record<string, string>> = {
  "mainnet-beta": MAINNET,
  devnet: DEVNET,
};

export function knownTokenSymbol(
  mint: string | undefined | null,
  network: NetworkId | undefined,
): string | null {
  if (!mint || !network) return null;
  return BY_NETWORK[network][mint] ?? null;
}
