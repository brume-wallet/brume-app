import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BrumeIcon } from "./BrumeIcon";

export function PageHeader(props: {
  title: string;
  backTo?: string;
  right?: ReactNode;
}) {
  return (
    <header className="flex items-center justify-between border-b border-border px-4 py-3">
      {props.backTo ? (
        <Link
          to={props.backTo}
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          aria-label="Back"
        >
          <BrumeIcon icon={ArrowLeft01Icon} size={22} />
        </Link>
      ) : (
        <span className="w-9" />
      )}
      <h1 className="text-base font-semibold text-foreground">{props.title}</h1>
      <div className="flex min-w-[36px] justify-end">{props.right}</div>
    </header>
  );
}
