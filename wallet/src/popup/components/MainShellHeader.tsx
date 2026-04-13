import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { BrumeIcon } from "./BrumeIcon";
import { NetworkBadge } from "./NetworkBadge";
import { SurfaceToggle } from "./SurfaceToggle";
import { readUiSurface, type UiSurface } from "../lib/ui-shell";
import { truncateMiddle } from "../lib/format";
import { useWalletStore } from "../store";

/** Sticky top chrome: account + network (matches bottom nav treatment). */
export function MainShellHeader() {
  const navigate = useNavigate();
  const { state } = useWalletStore();
  const [uiSurface, setUiSurface] = useState<UiSurface>("sidepanel");

  useEffect(() => {
    void readUiSurface().then(setUiSurface);
  }, []);

  if (!state) return null;

  const pk = state.publicKey ?? "";
  const displayName = (state.accountLabel ?? "Brume").trim() || "Brume";
  const initial = displayName.charAt(0).toUpperCase();

  async function copyAddr() {
    if (!pk) return;
    await navigator.clipboard.writeText(pk);
  }

  return (
    <header
      className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-background/95 px-4 pb-3 pt-[max(0.5rem,env(safe-area-inset-top,0px))] backdrop-blur-sm"
      aria-label="Wallet"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => navigate("/accounts")}
          aria-label="Manage accounts"
        >
          {initial}
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="truncate text-left text-[15px] font-semibold text-foreground hover:underline"
              onClick={() => navigate("/accounts")}
            >
              {displayName}
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="shrink-0 text-muted-foreground"
              onClick={() => void copyAddr()}
              aria-label="Copy address"
            >
              <BrumeIcon icon={Copy01Icon} size={18} />
            </Button>
          </div>
          {pk ? (
            <p className="truncate text-xs text-muted-foreground">
              {truncateMiddle(pk, 5, 4)}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <SurfaceToggle uiSurface={uiSurface} onSurfaceChange={setUiSurface} />
        <NetworkBadge network={state.network} />
      </div>
    </header>
  );
}
