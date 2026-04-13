import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { BrumeIcon } from "../components/BrumeIcon";
import { truncateMiddle } from "../lib/format";
import * as msg from "../messaging";
import { useWalletStore } from "../store";
import { cn } from "@/lib/utils";

export function EditAccount() {
  const { accountId: rawId } = useParams<{ accountId: string }>();
  const accountId = rawId ? decodeURIComponent(rawId) : "";
  const navigate = useNavigate();
  const { state, refresh } = useWalletStore();
  const acc = useMemo(
    () => state?.accounts.find((a) => a.id === accountId),
    [state?.accounts, accountId],
  );

  const [label, setLabel] = useState(acc?.label ?? "");

  /** Only re-seed when opening a different account — not on every vault refresh (same `acc` object identity churn). */
  useEffect(() => {
    if (acc) setLabel(acc.label);
  }, [accountId, acc?.id]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [removeBusy, setRemoveBusy] = useState(false);

  if (!state || !acc) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Account not found.{" "}
        <Link to="/accounts" className="text-primary underline">
          Back
        </Link>
      </div>
    );
  }

  async function saveName() {
    if (!acc) return;
    setErr(null);
    const t = label.trim().slice(0, 32);
    setSaving(true);
    try {
      await msg.renameAccount(acc.id, t);
      await refresh();
      const fresh = useWalletStore.getState().state?.accounts.find(
        (x) => x.id === acc.id,
      );
      if (fresh) setLabel(fresh.label);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function doRemove() {
    if (!state || !acc) return;
    if (
      !window.confirm(
        "Remove this account from Brume? You can restore it later with your recovery phrase or secret key backup.",
      )
    ) {
      return;
    }
    const wasLast = state.accounts.length === 1;
    const wasActive = acc.id === state.activeAccountId;
    setRemoveBusy(true);
    try {
      await msg.removeAccount(acc.id);
      await refresh();
      if (wasLast) navigate("/welcome", { replace: true });
      else if (wasActive) navigate("/", { replace: true });
      else navigate("/accounts", { replace: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Remove failed");
    } finally {
      setRemoveBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 px-4 pb-24 pt-4">
      <div className="flex items-center gap-2">
        <Link
          to="/accounts"
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-xs" }),
            "shrink-0 text-muted-foreground",
          )}
          aria-label="Back"
        >
          <BrumeIcon icon={ArrowLeft02Icon} size={22} />
        </Link>
        <h1 className="flex-1 text-center text-lg font-semibold text-foreground pr-8">
          Edit account
        </h1>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-2xl font-bold text-foreground">
          {(
            label.trim().charAt(0) ||
            acc.address.charAt(0) ||
            "?"
          ).toUpperCase()}
        </div>
      </div>

      <div className="rounded-2xl bg-card p-4 ring-1 ring-border/60">
        <FieldGroup className="gap-3">
          <Field>
            <FieldLabel htmlFor="acct-name" className="text-xs">
              Account name
            </FieldLabel>
            <div className="flex gap-2">
              <Input
                id="acct-name"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="h-10 rounded-xl"
                maxLength={32}
              />
              <Button
                type="button"
                size="sm"
                className="h-10 shrink-0 rounded-xl"
                disabled={
                  saving || label.trim().slice(0, 32) === acc.label.trim()
                }
                onClick={() => void saveName()}
              >
                Save
              </Button>
            </div>
            {err ? <FieldError>{err}</FieldError> : null}
          </Field>
          <div className="border-t border-border pt-3">
            <p className="text-xs text-muted-foreground">Account address</p>
            <p className="mt-1 font-mono text-[13px] text-foreground">
              {truncateMiddle(acc.address, 6, 6)}
            </p>
          </div>
        </FieldGroup>
      </div>

      <Link
        to={`/accounts/${encodeURIComponent(acc.id)}/private-key`}
        className={cn(
          buttonVariants({ variant: "secondary" }),
          "flex h-auto min-h-12 w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left no-underline ring-1 ring-border/60",
        )}
      >
        <span className="text-[15px] font-medium text-foreground">
          Show private key
        </span>
        <span className="text-muted-foreground">›</span>
      </Link>

      <Button
        type="button"
        variant="ghost"
        className="h-12 w-full rounded-2xl text-destructive hover:bg-destructive/10 hover:text-destructive"
        disabled={removeBusy}
        onClick={() => void doRemove()}
      >
        {removeBusy ? "Removing…" : "Remove account"}
      </Button>
    </div>
  );
}
