import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LinkCircleIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrumeIcon } from "../components/BrumeIcon";
import * as msg from "../messaging";
import { useWalletStore } from "../store";

export function ApproveConnect() {
  const navigate = useNavigate();
  const { state, refresh } = useWalletStore();
  const [busy, setBusy] = useState(false);

  const pending = state?.pendingConnect;

  async function approve() {
    if (!pending) return;
    setBusy(true);
    try {
      await msg.approveConnect(pending.id);
      await refresh();
      navigate("/", { replace: true });
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    if (!pending) return;
    setBusy(true);
    try {
      await msg.rejectConnect(pending.id);
      await refresh();
      navigate("/", { replace: true });
    } finally {
      setBusy(false);
    }
  }

  if (!pending) return null;

  return (
    <div className="flex min-h-[600px] flex-col gap-5 bg-background p-6">
      <div className="flex justify-center pt-4 text-primary">
        <BrumeIcon icon={LinkCircleIcon} size={64} />
      </div>
      <h1 className="text-center text-xl font-semibold text-foreground">
        Connect site
      </h1>
      <p className="text-center text-sm text-muted-foreground">
        This site wants to view your address and request signatures.
      </p>
      <Card size="sm" className="py-4">
        <CardHeader className="px-4 pb-0">
          <CardTitle className="text-[11px] font-normal uppercase tracking-wide text-muted-foreground">
            Origin
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-1">
          <p className="break-all text-sm font-medium text-foreground">
            {pending.origin}
          </p>
        </CardContent>
      </Card>
      <p className="text-center text-xs text-amber-400/90">
        Only connect if you trust this site.
      </p>
      <div className="mt-auto flex flex-col gap-3">
        <Button
          type="button"
          className="h-12 rounded-2xl text-[15px]"
          disabled={busy}
          onClick={() => void approve()}
        >
          Connect
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-12 rounded-2xl text-[15px]"
          disabled={busy}
          onClick={() => void reject()}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
