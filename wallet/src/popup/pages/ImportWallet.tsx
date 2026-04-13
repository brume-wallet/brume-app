import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { validateMnemonicPhrase } from "@/shared/wallet-core";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { PasswordInput } from "../components/PasswordInput";
import * as msg from "../messaging";
import { useWalletStore } from "../store";

export function ImportWallet() {
  const navigate = useNavigate();
  const location = useLocation();
  const addAccountFlow = location.pathname.startsWith("/accounts/");
  const refresh = useWalletStore((s) => s.refresh);
  const [phrase, setPhrase] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit() {
    setErr(null);
    const trimmed = phrase.trim();
    if (!validateMnemonicPhrase(trimmed)) {
      setErr("Invalid recovery phrase.");
      return;
    }
    if (!addAccountFlow) {
      if (password.length < 8) {
        setErr("Use at least 8 characters.");
        return;
      }
      if (password !== confirm) {
        setErr("Passwords do not match.");
        return;
      }
    }
    setBusy(true);
    try {
      await msg.importWallet(trimmed, addAccountFlow ? undefined : password);
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
      <h1 className="text-xl font-semibold text-foreground">
        {addAccountFlow ? "Import account" : "Import wallet"}
      </h1>
      <p className="text-sm text-muted-foreground">
        Paste your 12–24 word recovery phrase.
        {addAccountFlow ? (
          <>
            {" "}
            Uses your existing wallet password from this session — unlock first
            if you see an error.
          </>
        ) : null}
      </p>
      <form
        className="mt-auto flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit();
        }}
      >
        <FieldGroup className="gap-3">
          <Field>
            <FieldLabel htmlFor="import-phrase" className="sr-only">
              Recovery phrase
            </FieldLabel>
            <Textarea
              id="import-phrase"
              name="mnemonic"
              className="min-h-[120px] rounded-2xl px-4 py-3 text-[15px]"
              placeholder="Recovery phrase"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              spellCheck={false}
              autoComplete="off"
            />
          </Field>
          {!addAccountFlow ? (
            <>
              <Field>
                <FieldLabel htmlFor="import-pw" className="sr-only">
                  Password
                </FieldLabel>
                <PasswordInput
                  id="import-pw"
                  name="password"
                  value={password}
                  onChange={setPassword}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="import-pw2" className="sr-only">
                  Confirm password
                </FieldLabel>
                <PasswordInput
                  id="import-pw2"
                  name="confirm"
                  value={confirm}
                  onChange={setConfirm}
                  placeholder="Confirm password"
                />
              </Field>
            </>
          ) : null}
          {err ? <FieldError>{err}</FieldError> : null}
        </FieldGroup>
        <Button
          type="submit"
          className="h-12 w-full rounded-2xl text-[15px]"
          disabled={busy}
        >
          {busy
            ? "Importing…"
            : addAccountFlow
              ? "Import account"
              : "Import wallet"}
        </Button>
      </form>
    </div>
  );
}
