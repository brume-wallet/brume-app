import { useState } from "react";
import QRCode from "react-qr-code";
import { Check, Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { useWalletStore } from "../store";

export function Receive() {
  const { state } = useWalletStore();
  const pk = state?.publicKey ?? "";
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!pk) return;
    await navigator.clipboard.writeText(pk);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <header className="flex items-start justify-between px-5 pt-4">
        <h1 className="text-[18px] font-semibold leading-7 text-foreground">
          Receive
        </h1>
        <Link
          to="/"
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "size-9 shrink-0 rounded-full bg-secondary text-foreground hover:bg-secondary/80",
          )}
          aria-label="Close"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </Link>
      </header>

      <div className="flex min-h-0 flex-1 flex-col items-center gap-6 px-5 pt-14">
        <p className="max-w-[260px] text-center text-sm text-muted-foreground">
          Use to receive tokens on the Solana network only. Other assets will be
          lost forever.
        </p>

        <Card size="sm" className="w-full max-w-[320px] gap-0 py-0">
          <CardContent className="flex flex-col items-center gap-4 px-6 py-6">
            {pk ? (
              <>
                <div className="rounded-2xl bg-white p-3">
                  <QRCode value={pk} size={180} />
                </div>
                <p className="max-w-[280px] break-all text-center text-xs text-muted-foreground">
                  {pk}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Unlock to view your address.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="shrink-0 px-5 pb-5 pt-4">
        <Button
          type="button"
          size="lg"
          className="h-12 w-full rounded-full text-[15px] font-normal"
          disabled={!pk}
          onClick={() => void copy()}
        >
          <span className="flex items-center justify-center gap-2">
            {copied ? (
              <Check className="h-4 w-4 text-[#34C759]" strokeWidth={2} />
            ) : (
              <Copy className="h-4 w-4" strokeWidth={2} />
            )}
            Copy Address
          </span>
        </Button>
      </div>
    </div>
  );
}
