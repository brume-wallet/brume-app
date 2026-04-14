import { Buffer } from "buffer";

// Polyfill Buffer for Solana deps. Service workers lack `window`; alias window → globalThis so web3 finds WebSocket.
const g = globalThis as typeof globalThis & { Buffer?: typeof Buffer };

if (g.Buffer === undefined) {
  g.Buffer = Buffer;
}

if (typeof globalThis.window === "undefined") {
  (globalThis as unknown as { window: typeof globalThis }).window = globalThis;
}
