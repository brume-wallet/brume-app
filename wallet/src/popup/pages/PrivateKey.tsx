import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft02Icon, Copy01Icon } from "@hugeicons/core-free-icons";
import { Button, buttonVariants } from "@/components/ui/button";
import { BrumeIcon } from "../components/BrumeIcon";
import * as msg from "../messaging";
import { useWalletStore } from "../store";
import { cn } from "@/lib/utils";

/** In-page step change only (shell already slides R→L via MainShell `accountSubpage`). */
const stepCrossfade = { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const };

export function PrivateKey() {
  const { accountId: rawId } = useParams<{ accountId: string }>();
  const accountId = rawId ? decodeURIComponent(rawId) : "";
  const navigate = useNavigate();
  const { state } = useWalletStore();

  const acc = useMemo(
    () => state?.accounts.find((a) => a.id === accountId),
    [state?.accounts, accountId],
  );

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isActive = acc && state && acc.id === state.activeAccountId;

  async function reveal() {
    if (!isActive) return;
    setErr(null);
    setBusy(true);
    try {
      const r = await msg.exportSecret();
      setSecret(r.secretKeyBase64);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not export key");
    } finally {
      setBusy(false);
    }
  }

  async function copySecret() {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setErr("Could not copy to clipboard");
    }
  }

  if (!state || !acc) {
    return (
      <div className="flex flex-col gap-4 px-4 pb-24 pt-4">
        <p className="text-sm text-muted-foreground">
          Account not found.{" "}
          <Link to="/accounts" className="text-primary underline">
            Back
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col gap-4 bg-background px-4 pb-24 pt-4">
      <div className="flex items-center gap-2">
        <Link
          to={`/accounts/${encodeURIComponent(acc.id)}/edit`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-xs" }),
            "shrink-0 text-muted-foreground",
          )}
          aria-label="Back"
        >
          <BrumeIcon icon={ArrowLeft02Icon} size={22} />
        </Link>
        <h1 className="flex-1 pr-8 text-center text-lg font-semibold text-foreground">
          Your Private Key
        </h1>
      </div>

      <div className="rounded-2xl bg-[#2c1414] px-4 py-3.5 text-center ring-1 ring-[#4a2525]">
        <p className="text-[15px] font-bold leading-snug text-[#ff5c33]">
          Do <u>not</u> share your Private Key!
        </p>
        <p className="mt-2 text-xs font-normal leading-relaxed text-[#ff5c33]/90">
          If someone has your Private Key they will have full control of your
          wallet.
        </p>
      </div>

      {!isActive ? (
        <p className="text-center text-sm text-muted-foreground">
          Switch to this account from Manage accounts, then open this screen
          again to export its key.
        </p>
      ) : null}

      {isActive && !secret ? (
        <motion.div
          key="private-key-reveal-prompt"
          className="flex w-full min-w-0 flex-col gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={stepCrossfade}
        >
          {err ? <p className="text-xs text-destructive">{err}</p> : null}
          <Button
            type="button"
            className="h-12 rounded-2xl text-[15px]"
            disabled={busy}
            onClick={() => void reveal()}
          >
            {busy ? "…" : "Reveal private key"}
          </Button>
        </motion.div>
      ) : null}

      {isActive && secret ? (
        <motion.div
          key="private-key-revealed"
          className="flex w-full min-w-0 flex-col gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={stepCrossfade}
        >
          <div className="flex shrink-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/40 ring-1 ring-border/50">
            <div className="px-4 py-4 text-center font-mono text-[20px] leading-snug tracking-wide text-foreground [overflow-wrap:anywhere] break-all hyphens-none">
              {secret}
            </div>
            <div className="shrink-0 border-t border-border/70">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 py-3.5 text-[15px] font-medium text-foreground transition-colors hover:bg-muted/40"
                onClick={() => void copySecret()}
              >
                <BrumeIcon icon={Copy01Icon} size={20} />
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
          {err ? <p className="text-xs text-destructive">{err}</p> : null}
        </motion.div>
      ) : null}

      <Button
        type="button"
        variant="secondary"
        className="mt-auto h-12 w-full rounded-full text-[15px] font-medium"
        onClick={() =>
          navigate(`/accounts/${encodeURIComponent(acc.id)}/edit`, {
            replace: true,
          })
        }
      >
        Done
      </Button>
    </div>
  );
}
