import { formatTokenListAmount } from "@/lib/utils";
import { SOL_BASE_UNITS_PER_SOL } from "@/shared/constants";
import { cn } from "@/lib/utils";

export function BalanceCard(props: {
  balanceSolBaseUnits: string | null;
  simpleMode: boolean;
  totalUsdApprox: number | null;
  totalPortfolioSolApprox: number | null;
  /** When true, total USD line uses SVG pixelation (extension-style hide). */
  balanceHidden?: boolean;
}) {
  const raw =
    props.balanceSolBaseUnits != null && props.balanceSolBaseUnits !== ""
      ? BigInt(props.balanceSolBaseUnits)
      : null;
  const nativeSol =
    raw != null ? Number(raw) / Number(SOL_BASE_UNITS_PER_SOL) : null;

  const solSubtitle =
    props.totalPortfolioSolApprox != null
      ? props.totalPortfolioSolApprox
      : nativeSol;

  const hidden = props.balanceHidden === true;

  return (
    <div className="relative brume-animate-in px-1 pt-2 text-center">
      <svg
        aria-hidden
        className="pointer-events-none absolute h-0 w-0 overflow-hidden"
        width={0}
        height={0}
      >
        <defs>
          <filter id="brume-pixelate-lg" x="0" y="0" width="100%" height="100%">
            <feFlood x="4" y="4" height="2" width="2" />
            <feComposite width="10" height="10" />
            <feTile result="a" />
            <feComposite in="SourceGraphic" in2="a" operator="in" />
            <feMorphology operator="dilate" radius="5" />
          </filter>
          <filter id="brume-pixelate-sm" x="0" y="0" width="100%" height="100%">
            <feFlood x="3" y="3" height="2" width="2" />
            <feComposite width="8" height="8" />
            <feTile result="a" />
            <feComposite in="SourceGraphic" in2="a" operator="in" />
            <feMorphology operator="dilate" radius="4" />
          </filter>
        </defs>
      </svg>

      <p
        className={cn(
          "text-[34px] font-semibold leading-tight tracking-tight text-foreground",
          hidden && "text-[#bbbbc0]",
        )}
        style={
          hidden
            ? { filter: "url(#brume-pixelate-lg)", userSelect: "none" }
            : undefined
        }
      >
        {props.totalUsdApprox != null
          ? `$${props.totalUsdApprox.toFixed(2)}`
          : "—"}
      </p>
      {solSubtitle != null && Number.isFinite(solSubtitle) && (
        <p
          className={cn(
            "mt-1 text-muted-foreground",
            props.simpleMode ? "text-sm" : "font-mono text-[11px]",
            hidden && "text-[#c8c8cc]",
          )}
          style={
            hidden
              ? { filter: "url(#brume-pixelate-sm)", userSelect: "none" }
              : undefined
          }
        >
          {`${formatTokenListAmount(solSubtitle)} SOL`}
        </p>
      )}
    </div>
  );
}
