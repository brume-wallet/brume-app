import { Buffer } from "buffer";

/**
 * Solana web3 / bn.js expect Node's `Buffer` when bundled for the extension UI, SW, and injected script.
 * The bundled `Connection` stack references `window.WebSocket`; MV3 service workers have `WebSocket` on
 * `globalThis` but no `window`, so we alias it in worker contexts only.
 */
const g = globalThis as typeof globalThis & { Buffer?: typeof Buffer };

if (g.Buffer === undefined) {
  g.Buffer = Buffer;
}

if (typeof globalThis.window === "undefined") {
  (globalThis as unknown as { window: typeof globalThis }).window = globalThis;
}
