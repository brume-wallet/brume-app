import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { PasswordInput } from "../components/PasswordInput";
import { ShieldAnimation } from "../components/ShieldAnimation";
import { requestUnlockConfetti } from "../components/UnlockConfettiHost";
import * as msg from "../messaging";
import { useWalletStore } from "../store";

export function Unlock() {
  const refresh = useWalletStore((s) => s.refresh);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  // Same pattern as extension PinInput: run pin-shake for 0.5s when an error appears
  // so the animation can replay on every failed attempt.
  useEffect(() => {
    if (!err) return;
    setShake(true);
    const t = setTimeout(() => setShake(false), 500);
    return () => clearTimeout(t);
  }, [err]);

  async function submit() {
    setErr(null);
    setBusy(true);
    try {
      await msg.unlock(password);
      requestUnlockConfetti();
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Unlock failed");
      setPassword("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto bg-background px-5 py-6">
      <div className="flex w-full max-w-[300px] flex-col items-center">
        <div className="mb-8 flex flex-col items-center gap-1">
          <ShieldAnimation size={80} />
        </div>
        <p className="text-center text-[15px] font-medium text-muted-foreground">
          Enter your password
        </p>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          One password unlocks every account in this wallet.
        </p>

        <form
          className="mt-8 w-full"
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
              <div
                className={`w-full ${
                  shake ? "brume-pin-shake rounded-2xl" : "rounded-2xl"
                }`}
              >
                <PasswordInput
                  id="unlock-password"
                  name="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Password"
                  autoFocus
                  className="text-center"
                />
              </div>
              {err ? (
                <FieldError className="text-center text-[13px] leading-4 text-[#FF3B30]">
                  {err}
                </FieldError>
              ) : null}
            </Field>
            <Button
              type="submit"
              size="lg"
              className="h-12 w-full rounded-full text-[15px] font-normal"
              disabled={busy || !password}
            >
              {busy ? "Unlocking…" : "Unlock"}
            </Button>
          </FieldGroup>
        </form>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          <span className="cursor-default opacity-80">Forgot password</span>
        </p>
      </div>
    </div>
  );
}
