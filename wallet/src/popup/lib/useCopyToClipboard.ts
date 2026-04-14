import { useEffect, useRef, useState } from "react";

export function useCopyToClipboard(value: string | null | undefined, opts?: { ms?: number }) {
  const ms = opts?.ms ?? 1500;
  const [copied, setCopied] = useState(false);
  const t = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (t.current != null) {
        window.clearTimeout(t.current);
        t.current = null;
      }
    };
  }, []);

  async function copy(): Promise<boolean> {
    const v = (value ?? "").trim();
    if (!v) return false;
    try {
      await navigator.clipboard.writeText(v);
      setCopied(true);
      if (t.current != null) window.clearTimeout(t.current);
      t.current = window.setTimeout(() => setCopied(false), ms);
      return true;
    } catch {
      return false;
    }
  }

  return { copied, copy };
}

