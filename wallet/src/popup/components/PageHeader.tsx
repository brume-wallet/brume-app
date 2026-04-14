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
    <header className="flex items-center justify-between border-b border-border px-2 py-2">
      {props.backTo ? (
        <Link
          to={props.backTo}
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "size-9 shrink-0 rounded-full bg-secondary text-[color:var(--extension-icon)] hover:bg-black/[0.08] dark:hover:bg-white/10",
          )}
          aria-label="Back"
        >
          <BrumeIcon icon={ArrowLeft01Icon} size={22} />
        </Link>
      ) : (
        <span className="w-9 shrink-0" />
      )}
      <h1 className="min-w-0 flex-1 truncate px-2 text-center text-[18px] font-semibold leading-7 text-foreground">
        {props.title}
      </h1>
      <div className="flex min-w-[36px] shrink-0 justify-end">{props.right}</div>
    </header>
  );
}
