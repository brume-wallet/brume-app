import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Welcome() {
  return (
    <div className="flex min-h-[600px] flex-col bg-background px-6 pb-8 pt-10">
      <header className="text-center">
        <p className="text-[15px] font-semibold lowercase tracking-wide text-foreground">
          brume
        </p>
        <h1 className="mt-6 text-2xl font-semibold text-foreground">
          Your Solana wallet
        </h1>
        <p className="mx-auto mt-3 max-w-[280px] text-[15px] leading-relaxed text-muted-foreground">
          A clean, local-first wallet for devnet and beyond.
        </p>
      </header>
      <div className="mt-auto flex flex-col gap-3">
        <Link
          to="/create"
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-12 w-full justify-center rounded-2xl text-[15px]",
          )}
        >
          Create a new wallet
        </Link>
        <Link
          to="/import"
          className={cn(
            buttonVariants({ variant: "secondary", size: "lg" }),
            "h-12 w-full justify-center rounded-2xl text-[15px]",
          )}
        >
          I already have a wallet
        </Link>
        <Link
          to="/import-private-key"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-[13px] text-muted-foreground hover:text-foreground",
          )}
        >
          Import with private key
        </Link>
      </div>
    </div>
  );
}
