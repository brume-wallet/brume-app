import { Outlet, useLocation } from "react-router-dom";
import { isSendPath, outletPresenceKey } from "../lib/account-routes";
import { RouteContentFade } from "./RouteContentFade";

const shellClass = "flex min-h-0 flex-1 flex-col overflow-hidden";

export function AnimatedOutlet() {
  const { pathname } = useLocation();
  const presenceKey = outletPresenceKey(pathname);
  const mainShellOnly = presenceKey === "__main__";

  return (
    <div className={shellClass}>
      {mainShellOnly ? (
        <div className={shellClass}>
          <Outlet />
        </div>
      ) : (
        <RouteContentFade
          routeKey={pathname}
          variant={isSendPath(pathname) ? "send" : "fade"}
          className={shellClass}
        >
          <Outlet />
        </RouteContentFade>
      )}
    </div>
  );
}
