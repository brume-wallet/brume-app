import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  createMnemonic12,
  normalizeMnemonic,
} from "@/shared/wallet-core";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { PasswordInput } from "../components/PasswordInput";
import { SeedPhraseGrid } from "../components/SeedPhraseGrid";
import * as msg from "../messaging";
import { useWalletStore } from "../store";

export function CreateWallet() {
  const navigate = useNavigate();
  const location = useLocation();
  const addAccountFlow = location.pathname.startsWith("/accounts/");
  const refresh = useWalletStore((s) => s.refresh);
  const mnemonic = useMemo(() => createMnemonic12(), []);
  const words = useMemo(
    () => normalizeMnemonic(mnemonic).split(" "),
    [mnemonic],
  );
  const [step, setStep] = useState<"show" | "verify" | "password">("show");
  const [shuffled, setShuffled] = useState<{ word: string; key: string }[]>(
    [],
  );
  const [order, setOrder] = useState<string[]>([]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function startVerify() {
    const deck = words.map((word, i) => ({
      word,
      key: `${i}-${word}`,
    }));
    deck.sort(() => Math.random() - 0.5);
    setShuffled(deck);
    setOrder([]);
    setStep("verify");
  }

  function tapToken(w: string) {
    setOrder((prev) => {
      const next = prev.filter((x) => x !== w);
      if (next.length === prev.length) {
        if (prev.length >= words.length) return prev;
        return [...prev, w];
      }
      return next;
    });
  }

  const verifyOk =
    order.length === words.length &&
    normalizeMnemonic(order.join(" ")) === normalizeMnemonic(mnemonic);

  async function finishAddAccount() {
    if (!addAccountFlow) return;
    setErr(null);
    setBusy(true);
    try {
      await msg.createWallet(mnemonic);
      await refresh();
      navigate("/", { replace: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    setErr(null);
    if (password.length < 8) {
      setErr("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await msg.createWallet(mnemonic, password);
      await refresh();
      navigate("/", { replace: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[600px] flex-col gap-4 bg-background p-6">
      <Link
        to={addAccountFlow ? "/accounts/add" : "/welcome"}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ml-2 w-fit px-2 text-muted-foreground hover:text-foreground",
        )}
      >
        ← Back
      </Link>
      {step === "show" && (
        <div className="flex flex-col gap-4">
          <h1 className="text-xl font-semibold text-foreground">
            {addAccountFlow ? "New account phrase" : "Backup phrase"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {addAccountFlow
              ? "This phrase is only for this new account. Store it safely. Adding the account uses your existing wallet password from this session — unlock first if you see an error."
              : "Write these words down. Anyone with them controls your funds."}
          </p>
          <SeedPhraseGrid words={words} />
          <Button
            type="button"
            className="mt-4 h-12 w-full rounded-2xl text-[15px]"
            onClick={startVerify}
          >
            I wrote them down
          </Button>
        </div>
      )}
      {step === "verify" && (
        <div className="flex flex-col gap-4">
          <h1 className="text-xl font-semibold text-foreground">Verify order</h1>
          <p className="text-sm text-muted-foreground">
            Tap words in the same order as your backup sheet. Tap again to
            remove.
          </p>
          <div className="flex min-h-[48px] flex-wrap gap-2 rounded-2xl border border-dashed border-border bg-muted/20 p-2">
            {order.map((w, i) => (
              <span
                key={`${i}-${w}`}
                className="rounded-lg bg-primary/15 px-2 py-1 text-xs text-primary"
              >
                {w}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {shuffled.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => tapToken(t.word)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-xs font-medium transition-colors duration-150 active:scale-[0.97]",
                  order.includes(t.word)
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-border bg-card text-foreground ring-1 ring-border/60",
                )}
              >
                {t.word}
              </button>
            ))}
          </div>
          <Button
            type="button"
            disabled={!verifyOk || busy}
            className="mt-4 h-12 w-full rounded-2xl text-[15px] disabled:opacity-40"
            onClick={() => {
              if (addAccountFlow) void finishAddAccount();
              else setStep("password");
            }}
          >
            {addAccountFlow ? (busy ? "Adding…" : "Add account") : "Continue"}
          </Button>
        </div>
      )}
      {step === "password" && (
        <div>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void finish();
            }}
          >
            <h1 className="text-xl font-semibold text-foreground">
              {addAccountFlow ? "Encrypt account" : "Encrypt wallet"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Password encrypts this account on this device (PBKDF2 + AES-GCM).
            </p>
            <FieldGroup className="gap-3">
              <Field>
                <FieldLabel htmlFor="create-pw" className="sr-only">
                  Password
                </FieldLabel>
                <PasswordInput
                  id="create-pw"
                  name="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Password"
                  autoFocus
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="create-pw2" className="sr-only">
                  Confirm password
                </FieldLabel>
                <PasswordInput
                  id="create-pw2"
                  name="confirm"
                  value={confirm}
                  onChange={setConfirm}
                  placeholder="Confirm password"
                />
              </Field>
              {err ? <FieldError>{err}</FieldError> : null}
            </FieldGroup>
            <Button
              type="submit"
              className="h-12 w-full rounded-2xl text-[15px]"
              disabled={busy}
            >
              {busy
                ? addAccountFlow
                  ? "Adding…"
                  : "Creating…"
                : addAccountFlow
                  ? "Add account"
                  : "Create wallet"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
