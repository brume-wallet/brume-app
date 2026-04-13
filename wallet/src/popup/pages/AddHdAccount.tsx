import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { Button, buttonVariants } from "@/components/ui/button";
import { BrumeIcon } from "../components/BrumeIcon";
import * as msg from "../messaging";
import { useWalletStore } from "../store";
import { cn } from "@/lib/utils";

export function AddHdAccount() {
  const navigate = useNavigate();
  const refresh = useWalletStore((s) => s.refresh);
  const { state } = useWalletStore();

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function add() {
    if (busy) return;
    setErr(null);
    setBusy(true);
    try {
      await msg.addHdAccount();
      await refresh();
      navigate("/", { replace: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not add account");
    } finally {
      setBusy(false);
    }
  }

  if (state && !state.hdDerivationAvailable) {
    return (
      <div className="flex flex-col gap-4 px-4 pb-24 pt-4">
        <div className="flex items-center gap-2">
          <Link
            to="/accounts/add"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-xs" }),
              "shrink-0 text-muted-foreground",
            )}
            aria-label="Back"
          >
            <BrumeIcon icon={ArrowLeft02Icon} size={22} />
          </Link>
          <h1 className="flex-1 pr-8 text-center text-lg font-semibold text-foreground">
            Add account
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Derived accounts from one recovery phrase are only available for
          wallets created or imported after this update. You can still create a
          new wallet with its own phrase or import another phrase from{" "}
          <Link to="/accounts/add" className="text-primary underline">
            Add account
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col gap-4 bg-background px-4 pb-24 pt-4">
      <div className="flex items-center gap-2">
        <Link
          to="/accounts/add"
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-xs" }),
            "shrink-0 text-muted-foreground",
          )}
          aria-label="Back"
        >
          <BrumeIcon icon={ArrowLeft02Icon} size={22} />
        </Link>
        <h1 className="flex-1 pr-8 text-center text-lg font-semibold text-foreground">
          Add account
        </h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Derives the next address from your saved recovery phrase using the
        Solana BIP44 path{" "}
        <span className="font-mono text-xs text-foreground/80">
          m/44&apos;/501&apos;/…&apos;/0&apos;
        </span>{" "}
        (same family as Phantom and Solflare). Uses your wallet password from
        this session — unlock first if you see an error.
      </p>

      {err ? (
        <p className="text-sm text-destructive" role="alert">
          {err}
        </p>
      ) : null}

      <Button
        type="button"
        className="h-12 rounded-2xl text-[15px]"
        disabled={busy}
        onClick={() => void add()}
      >
        {busy ? "Adding…" : "Add account"}
      </Button>
    </div>
  );
}
