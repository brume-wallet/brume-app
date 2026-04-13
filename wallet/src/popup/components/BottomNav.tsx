import { NavLink } from "react-router-dom";
import {
  Clock01Icon,
  Home01Icon,
  Shield01Icon,
  SentIcon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import { BrumeIcon } from "./BrumeIcon";
import { cn } from "@/lib/utils";
import { isShieldFeatureEnabled } from "@/shared/constants";
import { useWalletStore } from "../store";

const linkBase =
  "relative flex flex-1 flex-col items-center justify-center gap-0.5 overflow-hidden py-2 text-[10px] font-medium transition-colors duration-200";

export function BottomNav() {
  const { state } = useWalletStore();
  const shieldEnabled = isShieldFeatureEnabled(state?.network ?? "devnet");
  return (
    <nav
      className="mt-auto flex shrink-0 border-t border-border bg-background/95 pb-[max(0.25rem,env(safe-area-inset-bottom,0px))] pt-0.5 backdrop-blur-sm"
      aria-label="Main"
    >
      <NavLink to="/" end className={linkBase}>
        {({ isActive }) => (
          <>
            {isActive ? (
              <span className="absolute inset-x-1 top-1 bottom-1 rounded-2xl bg-primary/15" />
            ) : null}
            <span className="relative z-[1] flex flex-col items-center gap-0.5">
              <BrumeIcon
                icon={Home01Icon}
                className={cn(isActive ? "text-primary" : "text-muted-foreground")}
                size={24}
              />
              <span className={cn(isActive ? "text-primary" : "text-muted-foreground")}>
                Home
              </span>
            </span>
          </>
        )}
      </NavLink>
      <NavLink to="/send" className={linkBase}>
        {({ isActive }) => (
          <>
            {isActive ? (
              <span className="absolute inset-x-1 top-1 bottom-1 rounded-2xl bg-primary/15" />
            ) : null}
            <span className="relative z-[1] flex flex-col items-center gap-0.5">
              <BrumeIcon
                icon={SentIcon}
                className={cn(isActive ? "text-primary" : "text-muted-foreground")}
                size={24}
              />
              <span className={cn(isActive ? "text-primary" : "text-muted-foreground")}>
                Send
              </span>
            </span>
          </>
        )}
      </NavLink>
      {shieldEnabled ? (
        <NavLink to="/shield" className={linkBase}>
          {({ isActive }) => (
            <>
              {isActive ? (
                <span className="absolute inset-x-1 top-1 bottom-1 rounded-2xl bg-primary/15" />
              ) : null}
              <span className="relative z-[1] flex flex-col items-center gap-0.5">
                <BrumeIcon
                  icon={Shield01Icon}
                  className={cn(isActive ? "text-primary" : "text-muted-foreground")}
                  size={24}
                />
                <span className={cn(isActive ? "text-primary" : "text-muted-foreground")}>
                  Shield
                </span>
              </span>
            </>
          )}
        </NavLink>
      ) : (
        <span
          className={cn(linkBase, "cursor-default opacity-40")}
          title="Shield is only available on Devnet"
          aria-label="Shield — Devnet only"
        >
          <span className="relative z-[1] flex flex-col items-center gap-0.5">
            <BrumeIcon icon={Shield01Icon} className="text-muted-foreground" size={24} />
            <span className="text-muted-foreground">Shield</span>
          </span>
        </span>
      )}
      <NavLink to="/activity" className={linkBase}>
        {({ isActive }) => (
          <>
            {isActive ? (
              <span className="absolute inset-x-1 top-1 bottom-1 rounded-2xl bg-primary/15" />
            ) : null}
            <span className="relative z-[1] flex flex-col items-center gap-0.5">
              <BrumeIcon
                icon={Clock01Icon}
                className={cn(isActive ? "text-primary" : "text-muted-foreground")}
                size={24}
              />
              <span className={cn(isActive ? "text-primary" : "text-muted-foreground")}>
                Activity
              </span>
            </span>
          </>
        )}
      </NavLink>
      <NavLink to="/settings" className={linkBase}>
        {({ isActive }) => (
          <>
            {isActive ? (
              <span className="absolute inset-x-1 top-1 bottom-1 rounded-2xl bg-primary/15" />
            ) : null}
            <span className="relative z-[1] flex flex-col items-center gap-0.5">
              <BrumeIcon
                icon={Settings01Icon}
                className={cn(isActive ? "text-primary" : "text-muted-foreground")}
                size={24}
              />
              <span className={cn(isActive ? "text-primary" : "text-muted-foreground")}>
                Settings
              </span>
            </span>
          </>
        )}
      </NavLink>
    </nav>
  );
}
