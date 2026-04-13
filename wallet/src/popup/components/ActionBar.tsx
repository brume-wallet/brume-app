import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Clock01Icon,
  MoneyReceive01Icon,
  Shield01Icon,
  SentIcon,
} from "@hugeicons/core-free-icons";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isShieldFeatureEnabled } from "@/shared/constants";
import { BrumeIcon } from "./BrumeIcon";
import { useWalletStore } from "../store";

const tileClass = cn(
  buttonVariants({ variant: "secondary", size: "default" }),
  "h-auto min-h-[5.25rem] w-full flex-col gap-2 rounded-2xl py-4 font-normal shadow-none ring-1 ring-border/60",
  "hover:bg-accent/40 active:scale-[0.97]",
  "disabled:pointer-events-none disabled:opacity-40",
);

function Tile(props: {
  to?: string;
  onClick?: () => void;
  icon: ReactNode;
  label: string;
  disabled?: boolean;
}) {
  const inner = (
    <>
      <span className="text-primary">{props.icon}</span>
      <span className="text-xs font-medium text-foreground">{props.label}</span>
    </>
  );

  if (props.disabled) {
    return (
      <button type="button" disabled className={tileClass}>
        {inner}
      </button>
    );
  }
  if (props.to) {
    return (
      <Link to={props.to} className={tileClass}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" className={tileClass} onClick={props.onClick}>
      {inner}
    </button>
  );
}

export function ActionBar() {
  const { state } = useWalletStore();
  const shieldEnabled = isShieldFeatureEnabled(state?.network ?? "devnet");
  return (
    <div className="grid grid-cols-4 gap-2 px-1">
      <Tile
        to="/send"
        icon={<BrumeIcon icon={SentIcon} className="h-6 w-6" size={24} />}
        label="Send"
      />
      <Tile
        to={shieldEnabled ? "/shield" : undefined}
        disabled={!shieldEnabled}
        icon={
          <BrumeIcon icon={Shield01Icon} className="h-6 w-6" size={24} />
        }
        label="Shield"
      />
      <Tile
        to="/receive"
        icon={
          <BrumeIcon icon={MoneyReceive01Icon} className="h-6 w-6" size={24} />
        }
        label="Receive"
      />
      <Tile
        to="/activity"
        icon={<BrumeIcon icon={Clock01Icon} className="h-6 w-6" size={24} />}
        label="Activity"
      />
    </div>
  );
}
