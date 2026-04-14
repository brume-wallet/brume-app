import type { NetworkId } from "./constants";

// Block explorer used for transaction and account links from the wallet.

export type ExplorerId = "solana" | "solscan" | "orb" | "solana_fm";

export const EXPLORER_OPTIONS: readonly {
  id: ExplorerId;
  label: string;
  subtitle?: string;
}[] = [
  { id: "solana", label: "Solana Explorer" },
  { id: "solscan", label: "Solscan" },
  {
    id: "orb",
    label: "Helius Orb",
    subtitle: "orbmarkets.io",
  },
  { id: "solana_fm", label: "Solana FM" },
] as const;

export const DEFAULT_EXPLORER_ID: ExplorerId = "solana";

export function isExplorerId(v: string): v is ExplorerId {
  return (
    v === "solana" ||
    v === "solscan" ||
    v === "orb" ||
    v === "solana_fm"
  );
}

function orbCluster(network: NetworkId): string {
  return network === "devnet"
    ? "?cluster=devnet"
    : "?cluster=mainnet-beta";
}

function solanaFmCluster(network: NetworkId): string {
  return network === "devnet" ? "?cluster=devnet" : "";
}

// 
// URL to view a transaction signature on the chosen explorer.

export function explorerTxUrl(
  explorer: ExplorerId,
  network: NetworkId,
  signature: string,
): string {
  const sig = encodeURIComponent(signature);
  switch (explorer) {
    case "solana":
      return network === "devnet"
        ? `https://explorer.solana.com/tx/${sig}?cluster=devnet`
        : `https://explorer.solana.com/tx/${sig}`;
    case "solscan":
      return network === "devnet"
        ? `https://solscan.io/tx/${sig}?cluster=devnet`
        : `https://solscan.io/tx/${sig}`;
    case "orb":
      return `https://orbmarkets.io/tx/${sig}${orbCluster(network)}`;
    case "solana_fm":
      return `https://solana.fm/tx/${sig}${solanaFmCluster(network)}`;
    default:
      return network === "devnet"
        ? `https://explorer.solana.com/tx/${sig}?cluster=devnet`
        : `https://explorer.solana.com/tx/${sig}`;
  }
}

// 
// URL to view an account / generic address (wallet, program, etc.).

export function explorerAddressUrl(
  explorer: ExplorerId,
  network: NetworkId,
  address: string,
): string {
  const addr = encodeURIComponent(address);
  switch (explorer) {
    case "solana":
      return network === "devnet"
        ? `https://explorer.solana.com/address/${addr}?cluster=devnet`
        : `https://explorer.solana.com/address/${addr}`;
    case "solscan":
      return network === "devnet"
        ? `https://solscan.io/account/${addr}?cluster=devnet`
        : `https://solscan.io/account/${addr}`;
    case "orb":
      return `https://orbmarkets.io/address/${addr}${orbCluster(network)}`;
    case "solana_fm":
      return `https://solana.fm/address/${addr}${solanaFmCluster(network)}`;
    default:
      return network === "devnet"
        ? `https://explorer.solana.com/address/${addr}?cluster=devnet`
        : `https://explorer.solana.com/address/${addr}`;
  }
}

// 
// SPL mint — Solscan uses /token/; others treat the mint as a normal address.

export function explorerMintUrl(
  explorer: ExplorerId,
  network: NetworkId,
  mint: string,
): string {
  const m = encodeURIComponent(mint);
  if (explorer === "solscan") {
    return network === "devnet"
      ? `https://solscan.io/token/${m}?cluster=devnet`
      : `https://solscan.io/token/${m}`;
  }
  return explorerAddressUrl(explorer, network, mint);
}

export function normalizeExplorerId(raw: unknown): ExplorerId {
  return typeof raw === "string" && isExplorerId(raw)
    ? raw
    : DEFAULT_EXPLORER_ID;
}
