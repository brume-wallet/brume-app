import { Connection } from "@solana/web3.js";
import { NETWORKS, type NetworkId } from "@brume/shared/constants";

export function resolveRpcUrl(
  network: NetworkId,
  rpcUrlOverride?: string | null,
): string {
  const trimmed = rpcUrlOverride?.trim();
  if (trimmed) return trimmed;
  const fromEnv =
    network === "mainnet-beta"
      ? process.env.MAINNET_RPC_URL?.trim()
      : process.env.DEVNET_RPC_URL?.trim();
  if (fromEnv) return fromEnv;
  return NETWORKS[network].rpc;
}

export function getConnection(
  network: NetworkId,
  rpcUrlOverride?: string | null,
): Connection {
  return new Connection(resolveRpcUrl(network, rpcUrlOverride), {
    commitment: "confirmed",
  });
}
