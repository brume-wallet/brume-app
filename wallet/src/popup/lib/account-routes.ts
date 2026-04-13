/** Bottom-nav tabs: share one outlet presence key so the shell stays mounted. */
export function isMainTabPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/shield" ||
    pathname === "/activity" ||
    pathname === "/settings"
  );
}

/**
 * One key for the whole main shell (tabs + manage/add/edit/private-key) so the
 * outer outlet does not remount; motion stays inside MainShell.
 */
export function outletPresenceKey(pathname: string): string {
  if (isMainTabPath(pathname)) return "__main__";
  /** Keep MainShell mounted for token detail (same stack as home → token as Send → token). */
  if (pathname.startsWith("/token/")) return "__main__";
  if (pathname === "/accounts" || pathname.startsWith("/accounts/")) {
    return "__main__";
  }
  return pathname;
}

/** `/send` + nested send flow, and token detail (same slide-up / fade as send). */
export function isSendPath(pathname: string): boolean {
  return (
    pathname === "/send" ||
    pathname.startsWith("/send/") ||
    pathname.startsWith("/token/")
  );
}

/** `/accounts` list (not add/edit/private-key). */
export function isManageAccountsPath(pathname: string): boolean {
  return pathname === "/accounts";
}

/** Account flows under main shell except the list page (incl. private key). */
export function isAccountSubpagePath(pathname: string): boolean {
  return (
    pathname === "/accounts/add" ||
    pathname === "/accounts/add-hd" ||
    /^\/accounts\/[^/]+\/edit$/.test(pathname) ||
    pathname.endsWith("/private-key")
  );
}
