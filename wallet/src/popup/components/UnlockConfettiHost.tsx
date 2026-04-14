import { useEffect, useState } from "react";
import { ConfettiOverlay } from "./ConfettiOverlay";

const STORAGE_KEY = "brume_unlock_confetti";
const STORAGE_ACTIVE_KEY = "brume_unlock_confetti_active";

/** Call after successful unlock (before navigation away from /unlock). */
export function requestUnlockConfetti(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // ignore
  }
}

/**
 * Renders one-shot confetti when the shell loads after unlock.
 * Mount inside MainShell (or any route only shown when unlocked).
 */
export function UnlockConfettiHost() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") {
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.setItem(STORAGE_ACTIVE_KEY, "1");
        setShow(true);
      }
    } catch {
      // ignore
    }
  }, []);

  if (!show) return null;
  return (
    <ConfettiOverlay
      onComplete={() => {
        try {
          sessionStorage.removeItem(STORAGE_ACTIVE_KEY);
        } catch {
          // ignore
        }
        setShow(false);
      }}
    />
  );
}

export function isUnlockConfettiActive(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_ACTIVE_KEY) === "1";
  } catch {
    return false;
  }
}
