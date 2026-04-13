import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "../components/PageHeader";
import { useWalletStore } from "../store";

export function Receive() {
  const { state } = useWalletStore();
  const pk = state?.publicKey ?? "";

  async function copy() {
    if (!pk) return;
    await navigator.clipboard.writeText(pk);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <PageHeader title="Receive" backTo="/" />
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pb-8 pt-4">
        <p className="text-center text-sm text-muted-foreground">
          Scan or copy your address on{" "}
          <span className="text-foreground">{state?.network}</span>
        </p>
        <Card
          size="sm"
          className="mx-auto w-full max-w-[320px] gap-0 py-0 ring-border/60"
        >
          <CardContent className="flex flex-col items-center gap-4 px-6 py-6">
            {pk ? (
              <>
                <div className="rounded-2xl bg-white p-3">
                  <QRCode value={pk} size={168} />
                </div>
                <p className="max-w-[280px] break-all text-center text-xs text-muted-foreground">
                  {pk}
                </p>
                <Button
                  type="button"
                  className="rounded-2xl px-8"
                  onClick={() => void copy()}
                >
                  Copy address
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No public key</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
