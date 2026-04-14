import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { explorerTxUrl } from "@/shared/constants";
import { Button } from "@/components/ui/button";
import { ExtensionMascot } from "../components/ExtensionUxChrome";
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
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-6 pb-8 pt-10">
        <ExtensionMascot variant="success" />
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground">Transaction sent</h1>
          <p className="mt-2 text-base text-muted-foreground">
            Your transfer was submitted to the network.
          </p>
        </div>
        {explorer ? (
          <a
            href={explorer}
            target="_blank"
            rel="noreferrer"
            className="text-base font-normal text-[color:var(--extension-accent)] underline-offset-4 hover:underline"
          >
            View on explorer
          </a>
        ) : null}
      </div>
      <div className="border-t border-border px-5 pb-6 pt-4">
        <Button
          type="button"
          size="lg"
          className="h-12 w-full rounded-full text-[15px] font-normal"
          onClick={() => navigate("/", { replace: true })}
        >
          Done
        </Button>
      </div>
    </div>
  );
}
