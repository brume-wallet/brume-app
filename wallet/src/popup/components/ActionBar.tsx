import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowDownLeft, ArrowUpRight, Clock, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { isShieldFeatureEnabled } from "@/shared/constants";
import { useWalletStore } from "../store";

function ActionCircle(props: { children: ReactNode }) {
  return (
    <span
      className={cn(
        "flex size-12 shrink-0 items-center justify-center rounded-full transition-[transform,background-color]",
        "bg-[rgba(249,54,60,0.14)] hover:bg-[rgba(249,54,60,0.22)]",
        "active:scale-[0.93]",
      )}
    >
      <span className="text-foreground [&_svg]:text-foreground">{props.children}</span>
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
        icon={<ArrowUpRight className="h-6 w-6" strokeWidth={2} />}
        label="Send"
      />
      <Tile
        to="/receive"
        icon={<ArrowDownLeft className="h-6 w-6" strokeWidth={2} />}
        label="Receive"
      />
      <Tile
        to={shieldEnabled ? "/shield" : undefined}
        disabled={!shieldEnabled}
        icon={<Shield className="h-6 w-6" strokeWidth={2} />}
        label="Shield"
      />
      <Tile
        to="/activity"
        icon={<Clock className="h-6 w-6" strokeWidth={2} />}
        label="Activity"
      />
    </div>
  );
}
