import { Outlet, useLocation } from "react-router-dom";
import {
  isAccountSubpagePath,
  isMainTabPath,
  isManageAccountsPath,
} from "../lib/account-routes";
import { BottomNav } from "./BottomNav";
import { MainShellHeader } from "./MainShellHeader";
import {
  RouteContentFade,
  type RouteContentVariant,
} from "./RouteContentFade";

function mainNavVariant(pathname: string): RouteContentVariant {
  if (pathname === "/") return "home";
  if (
    pathname === "/shield" ||
    pathname === "/activity" ||
    pathname === "/settings"
  ) {
    return "secondaryNav";
  }
  return "fade";
}

function accountAreaVariant(pathname: string): RouteContentVariant {
  if (isManageAccountsPath(pathname)) return "manageAccounts";
  if (isAccountSubpagePath(pathname)) return "accountSubpage";
  return "fade";
}

function mainShellVariant(pathname: string): RouteContentVariant {
  if (isMainTabPath(pathname)) return mainNavVariant(pathname);
  if (pathname.startsWith("/token/")) return "send";
  return accountAreaVariant(pathname);
}

export function MainShell() {
  const { pathname, key: locationKey } = useLocation();
  const tokenDetailOpen = pathname.startsWith("/token/");

  return (
    <div className="flex min-h-0 w-full min-w-[360px] flex-1 flex-col overflow-hidden bg-background">
      {isMainTabPath(pathname) ? <MainShellHeader /> : null}
      <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain [-webkit-overflow-scrolling:touch]">
        <RouteContentFade
          routeKey={`${pathname}:${locationKey}`}
          variant={mainShellVariant(pathname)}
          className="flex min-h-min flex-col"
        >
          <Outlet />
        </RouteContentFade>
      </main>
      {tokenDetailOpen ? null : <BottomNav />}
    </div>
  );
}
