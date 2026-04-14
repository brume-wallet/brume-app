import { ClockOutlineIcon, ReceiveIcon, SendButtonIcon, ShieldIcon } from "@/components/Icons";
import { cn } from "@/lib/utils";
import { isShieldFeatureEnabled } from "@/shared/constants";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useWalletStore } from "../store";

function ActionCircle(props: { children: ReactNode }) {
  return (
    <span
      className={cn(
        "flex size-12 shrink-0 items-center justify-center rounded-full transition-[transform,background-color]",
        "bg-[rgba(249,54,60,0.14)] hover:bg-[rgba(3, 3, 3, 0.22)]",
        "dark:bg-white/10 dark:hover:bg-white/14 dark:ring-1 dark:ring-[rgba(249,54,60,0.35)]",
        "active:scale-[0.93]",
      )}
    >
      <span className="text-foreground [&_svg]:text-foreground dark:[&_svg]:text-[color:var(--extension-accent)]">
        {props.children}
      </span>
    </span>
  );
}

function Tile(props: {
  to?: string;
  onClick?: () => void;
  icon: ReactNode;
  label: string;
  disabled?: boolean;
}) {
  const inner = (
    <>
      <ActionCircle>{props.icon}</ActionCircle>
      <span className="text-[13px] leading-4 text-foreground">
        {props.label}
      </span>
    </>
  );

  const base =
    "flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5 overflow-hidden bg-transparent p-0 text-center";

  if (props.disabled) {
    return (
      <button type="button" disabled className={cn(base, "opacity-40")}>
        {inner}
      </button>
    );
  }
  if (props.to) {
    return (
      <Link to={props.to} className={cn(base, "cursor-pointer")}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" className={cn(base, "cursor-pointer")} onClick={props.onClick}>
      {inner}
    </button>
  );
}

export function ActionBar() {
  const { state } = useWalletStore();
  const shieldEnabled = isShieldFeatureEnabled(state?.network ?? "devnet");
  return (
    <div className="grid grid-cols-4 gap-2 px-1 pt-1">
      <Tile
        to="/send"
        icon={<SendButtonIcon />}
        label="Send"
      />
      <Tile
        to="/receive"
        icon={<ReceiveIcon />}
        label="Receive"
      />
      <Tile
        to={shieldEnabled ? "/shield" : undefined}
        disabled={!shieldEnabled}
        icon={<ShieldIcon />}
        label="Shield"
      />
      <Tile
        to="/activity"
        icon={<ClockOutlineIcon />}
        label="Activity"
      />
    </div>
  );
}
