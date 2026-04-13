import { useState } from "react";
import { CircleLock01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { PasswordInput } from "../components/PasswordInput";
import { BrumeIcon } from "../components/BrumeIcon";
import * as msg from "../messaging";
import { useWalletStore } from "../store";

export function Unlock() {
  const refresh = useWalletStore((s) => s.refresh);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    setBusy(true);
    try {
      await msg.unlock(password);
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Unlock failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <header className="flex items-center justify-center border-b border-border py-3">
        <span className="text-[15px] font-semibold lowercase tracking-wide text-foreground">
          brume
        </span>
      </header>
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-6 pt-6">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary/12 ring-1 ring-primary/25">
          <BrumeIcon icon={CircleLock01Icon} size={56} className="text-primary" />
        </div>
        <h1 className="mt-6 text-xl font-semibold text-foreground">
          Enter your password
        </h1>
        <p className="mt-2 max-w-[300px] text-center text-xs text-muted-foreground">
          One password unlocks every account in this wallet.
        </p>

        <form
          className="mt-8 w-full max-w-[300px]"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="unlock-password" className="sr-only">
                Password
              </FieldLabel>
              <PasswordInput
                id="unlock-password"
                name="password"
                value={password}
                onChange={setPassword}
                placeholder="Password"
                autoFocus
              />
              {err ? <FieldError>{err}</FieldError> : null}
            </Field>
            <Button
              type="submit"
              size="lg"
              className="h-12 w-full rounded-2xl text-[15px]"
              disabled={busy || !password}
            >
              {busy ? "Unlocking…" : "Unlock"}
            </Button>
          </FieldGroup>
        </form>
        <p className="mt-8 text-sm text-muted-foreground">
          <span className="cursor-default opacity-80">Forgot password</span>
        </p>
      </div>
    </div>
  );
}
