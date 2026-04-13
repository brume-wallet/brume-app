/** Wallet Standard style codes (subset) from SOLANA_WALLET.md */
export const WalletErrorCodes = {
  WalletNotReady: 4001,
  WalletConnectionError: 4002,
  WalletDisconnected: 4003,
  WalletSignTransactionError: 4004,
  WalletSignMessageError: 4005,
  WalletTimeoutError: 4006,
  WalletWindowClosedError: 4007,
  WalletUserRejected: 4100,
} as const;

export function walletError(
  code: number,
  message: string,
): { code: number; message: string } {
  return { code, message };
}

type ErrorWithSolanaMeta = Error & {
  transactionMessage?: unknown;
  transactionLogs?: string[];
  cause?: unknown;
};

function stringifyUnknown(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Turn any thrown value into a user-visible string. Handles:
 * - Solana `SendTransactionError` when RPC `error.message` is an object (shows as "[object Object]")
 * - Plain `{ message }` / `{ error: { message, issues } }` rejects
 */
export function messageFromUnknown(e: unknown): string {
  if (e instanceof Error) {
    const ex = e as ErrorWithSolanaMeta;
    const rawMsg = ex.message;
    const tm = ex.transactionMessage;
    const logs = ex.transactionLogs;

    const tmStr =
      tm === undefined
        ? ""
        : typeof tm === "string"
          ? tm
          : stringifyUnknown(tm);

    const badMessage =
      rawMsg === "[object Object]" ||
      (typeof rawMsg === "string" && rawMsg.includes("[object Object]"));

    if (badMessage || (tm !== undefined && typeof tm === "object")) {
      const logBlock =
        Array.isArray(logs) && logs.length
          ? `\nLogs:\n${logs.slice(-25).join("\n")}`
          : "";
      const head = tmStr.trim() || "Transaction failed";
      return `${head}${logBlock}`;
    }

    if (typeof rawMsg === "string" && rawMsg.trim()) return rawMsg;

    if (Array.isArray(logs) && logs.length) {
      return logs.slice(-25).join("\n");
    }

    if (ex.cause !== undefined) {
      const c = messageFromUnknown(ex.cause);
      if (c.trim()) return c;
    }

    return rawMsg?.trim() || ex.name || "Error";
  }

  if (typeof e === "string") return e;
  if (e && typeof e === "object") {
    const o = e as Record<string, unknown>;
    const m = o.message;
    if (typeof m === "string" && m.trim() && m !== "[object Object]") {
      return m;
    }
    const inner = o.error;
    if (typeof inner === "string" && inner.trim()) return inner;
    if (inner && typeof inner === "object") {
      const io = inner as Record<string, unknown>;
      if (typeof io.message === "string" && io.message.trim()) {
        return io.message;
      }
      const issues = io.issues;
      if (Array.isArray(issues)) {
        const parts = issues
          .map((item) => {
            if (!item || typeof item !== "object") return null;
            const im = (item as { message?: unknown }).message;
            return typeof im === "string" ? im : null;
          })
          .filter((s): s is string => !!s);
        if (parts.length) return parts.join("; ");
      }
    }
    return stringifyUnknown(e);
  }
  return String(e);
}
