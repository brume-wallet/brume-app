import { NETWORKS, type NetworkId } from "@/shared/constants";

export function NetworkBadge({ network }: { network: NetworkId }) {
  const n = NETWORKS[network];
  return (
    <span className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary-foreground">
      {n.label}
    </span>
  );
}
