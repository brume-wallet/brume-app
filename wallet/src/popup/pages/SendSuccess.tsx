import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { explorerTxUrl } from "@/shared/constants";
import { Button } from "@/components/ui/button";
import { BrumeIcon } from "../components/BrumeIcon";
import { useWalletStore } from "../store";

export function SendSuccess() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sig = params.get("sig") ?? "";
  const { state } = useWalletStore();

  const explorer = useMemo(() => {
    if (!sig || !state) return null;
    return explorerTxUrl(state.explorerId, state.network, sig);
  }, [sig, state]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-6 pb-8 pt-12">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 ring-2 ring-emerald-500/40">
          <BrumeIcon icon={Tick02Icon} size={44} className="text-emerald-400" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground">Transaction sent</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your transfer was submitted to the network.
          </p>
        </div>
        {explorer ? (
          <a
            href={explorer}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            View on explorer
          </a>
        ) : null}
      </div>
      <div className="border-t border-border px-5 pb-6 pt-4">
        <Button
          type="button"
          size="lg"
          className="h-12 w-full rounded-2xl text-[15px]"
          onClick={() => navigate("/", { replace: true })}
        >
          Close
        </Button>
      </div>
    </div>
  );
}
