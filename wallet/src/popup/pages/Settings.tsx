import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  EXPLORER_OPTIONS,
  type ExplorerId,
  type NetworkId,
} from "@/shared/constants";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ensureRpcHostPermission } from "../lib/rpc-permissions";
import * as msg from "../messaging";
import { useWalletStore } from "../store";
import { cn } from "@/lib/utils";

export function Settings() {
  const { state, refresh } = useWalletStore();
  const [sites, setSites] = useState<
    Array<{ origin: string; publicKey: string; connectedAt: number }>
  >([]);
  const [exported, setExported] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [rpcInput, setRpcInput] = useState("");
  const [rpcSaveErr, setRpcSaveErr] = useState<string | null>(null);
  const [savingRpc, setSavingRpc] = useState(false);
  const [savingExplorer, setSavingExplorer] = useState(false);

  useEffect(() => {
    void msg.listConnectedSites().then((r) => setSites(r.sites));
  }, [state?.publicKey, state?.activeAccountId]);

  useEffect(() => {
    setRpcInput(state?.rpcUrlOverride ?? "");
  }, [state?.rpcUrlOverride]);


  if (!state) return null;

  async function switchNetwork(n: NetworkId) {
    await msg.setNetwork(n);
    await refresh();
  }

  async function selectExplorer(id: ExplorerId) {
    if (!state || state.explorerId === id) return;
    setSavingExplorer(true);
    try {
      await msg.setExplorerId(id);
      await refresh();
    } finally {
      setSavingExplorer(false);
    }
  }

  async function doExport() {
    setErr(null);
    setExported(null);
    try {
      const r = await msg.exportSecret();
      setExported(r.secretKeyBase64);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Export failed");
    }
  }

  async function saveRpc() {
    setRpcSaveErr(null);
    const trimmed = rpcInput.trim();
    if (!trimmed) {
      setRpcSaveErr("Paste a full HTTPS RPC URL, or tap Reset to use the default.");
      return;
    }
    try {
      const u = new URL(trimmed);
      if (u.protocol !== "https:" && u.protocol !== "http:") {
        setRpcSaveErr("URL must start with https:// or http://");
        return;
      }
    } catch {
      setRpcSaveErr("Invalid URL.");
      return;
    }
    setSavingRpc(true);
    try {
      const ok = await ensureRpcHostPermission(trimmed);
      if (!ok) {
        setRpcSaveErr("Permission denied — allow host access when Chrome prompts.");
        return;
      }
      await msg.setRpcUrlOverride(trimmed);
      await refresh();
    } catch (e) {
      setRpcSaveErr(e instanceof Error ? e.message : "Failed to save RPC");
    } finally {
      setSavingRpc(false);
    }
  }

  async function clearRpc() {
    setRpcSaveErr(null);
    setSavingRpc(true);
    try {
      await msg.setRpcUrlOverride(null);
      setRpcInput("");
      await refresh();
    } catch (e) {
      setRpcSaveErr(e instanceof Error ? e.message : "Failed to reset");
    } finally {
      setSavingRpc(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 px-4 pb-24 pt-4">
      <h1 className="text-lg font-semibold text-foreground">Settings</h1>

      <Link
        to="/accounts"
        className={cn(
          buttonVariants({ variant: "secondary" }),
          "flex h-12 w-full items-center justify-center rounded-2xl text-[15px] no-underline",
        )}
      >
        Manage accounts
      </Link>

      <Button
        type="button"
        variant="secondary"
        className="h-12 w-full rounded-2xl text-[15px]"
        onClick={() => void msg.lockWallet().then(() => refresh())}
      >
        Lock wallet
      </Button>

      <Card size="sm" className="gap-3 py-4">
        <CardHeader className="px-4 pb-0">
          <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            RPC endpoint
          </CardTitle>
          <CardDescription className="text-[11px] leading-relaxed">
            Default public RPCs are rate-limited. For heavier use, paste a provider URL
            (QuickNode, Alchemy, etc.). Used for balance, signing, and on-chain sends.
            Portfolio and activity use the Brume API URL from the shared app constants
            (dev default: http://localhost:3001).
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pt-0">
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void saveRpc();
            }}
          >
            <Input
              className="h-9 rounded-xl px-3 text-xs"
              placeholder="https://…"
              value={rpcInput}
              onChange={(e) => setRpcInput(e.target.value)}
              spellCheck={false}
              autoComplete="off"
              name="rpcUrl"
            />
            {rpcSaveErr ? (
              <p className="text-xs text-destructive">{rpcSaveErr}</p>
            ) : null}
            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                className="h-9 flex-1 rounded-xl text-xs"
                disabled={savingRpc}
              >
                Save RPC
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-9 flex-1 rounded-xl text-xs"
                disabled={savingRpc}
                onClick={() => void clearRpc()}
              >
                Reset default
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card size="sm" className="gap-3 py-4">
        <CardHeader className="px-4 pb-0">
          <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Block explorer
          </CardTitle>
          <CardDescription className="text-[11px] leading-relaxed">
            Links for transactions and token mints (Activity, send success, token
            detail).
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pt-0">
          <div className="grid grid-cols-1 gap-2">
            {EXPLORER_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                disabled={savingExplorer}
                onClick={() => void selectExplorer(opt.id)}
                className={cn(
                  "flex flex-col items-start rounded-xl px-3 py-2.5 text-left transition-colors active:scale-[0.99]",
                  state.explorerId === opt.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                )}
              >
                <span className="text-xs font-semibold">{opt.label}</span>
                {opt.subtitle ? (
                  <span
                    className={cn(
                      "text-[10px] opacity-90",
                      state.explorerId === opt.id
                        ? "text-primary-foreground/90"
                        : "text-muted-foreground",
                    )}
                  >
                    {opt.subtitle}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card size="sm" className="gap-3 py-4">
        <CardHeader className="px-4 pb-0">
          <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Network
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-0">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void switchNetwork("devnet")}
              className={cn(
                "flex-1 rounded-xl py-2.5 text-xs font-semibold transition-colors duration-200 active:scale-[0.98]",
                state.network === "devnet"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground",
              )}
            >
              Devnet
            </button>
            <button
              type="button"
              onClick={() => void switchNetwork("mainnet-beta")}
              className={cn(
                "flex-1 rounded-xl py-2.5 text-xs font-semibold transition-colors duration-200 active:scale-[0.98]",
                state.network === "mainnet-beta"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground",
              )}
            >
              Mainnet
            </button>
          </div>
        </CardContent>
      </Card>

      <Card size="sm" className="gap-3 py-4">
        <CardHeader className="px-4 pb-0">
          <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Connected sites
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-0">
          {sites.length === 0 ? (
            <p className="text-xs text-muted-foreground">None yet.</p>
          ) : (
            <ul className="space-y-2">
              {sites.map((s) => (
                <li
                  key={s.origin}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <span className="truncate text-foreground">{s.origin}</span>
                  <button
                    type="button"
                    className="shrink-0 text-destructive transition-opacity hover:opacity-90"
                    onClick={() =>
                      void msg.disconnectSite(s.origin).then(() =>
                        msg.listConnectedSites().then((r) => setSites(r.sites)),
                      )
                    }
                  >
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card size="sm" className="gap-3 border-destructive/30 py-4">
        <CardHeader className="px-4 pb-0">
          <CardTitle className="text-xs font-semibold uppercase tracking-wide text-destructive">
            Export secret key
          </CardTitle>
          <CardDescription className="text-[11px]">
            Never share this. Available while the wallet is unlocked.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pt-0">
          <div className="flex flex-col gap-3">
            {err ? (
              <p className="text-xs text-destructive" role="alert">
                {err}
              </p>
            ) : null}
            <Button
              type="button"
              variant="destructive"
              className="w-full rounded-xl text-xs"
              onClick={() => void doExport()}
            >
              Reveal base64 secret
            </Button>
          </div>
          {exported && (
            <p className="mt-3 break-all font-mono text-[10px] text-muted-foreground">
              {exported}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
