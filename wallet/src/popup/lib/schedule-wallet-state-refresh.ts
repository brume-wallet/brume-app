// 
// After a confirmed on-chain action, defer zustand hydration so navigation / UI
// updates can paint first. The service worker already applied cache updates
// before responding.

export function scheduleWalletStateRefresh(
  refresh: () => Promise<void>,
): void {
  queueMicrotask(() => {
    void refresh().catch(() => {});
  });
}
