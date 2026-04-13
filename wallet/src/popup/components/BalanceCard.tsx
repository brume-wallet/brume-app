import { formatTokenListAmount } from "@/lib/utils";
import { SOL_BASE_UNITS_PER_SOL } from "@/shared/constants";

export function BalanceCard(props: {
  balanceSolBaseUnits: string | null;
  simpleMode: boolean;
  /** SOL + SPL, Jupiter-priced where available; null until first price payload. */
  totalUsdApprox: number | null;
  /**
   * Portfolio value in SOL (same basis as `totalUsdApprox` ÷ SOL/USD).
   * Null until Jupiter prices load; then use native SOL only as fallback.
   */
  totalPortfolioSolApprox: number | null;
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

  return (
    <div className="brume-animate-in px-1 pt-2 text-center">
      <p className="text-[34px] font-semibold leading-tight tracking-tight text-foreground">
        {props.totalUsdApprox != null
          ? `$${props.totalUsdApprox.toFixed(2)}`
          : "—"}
      </p>
      {solSubtitle != null && Number.isFinite(solSubtitle) && (
        <p
          className={`mt-1 text-muted-foreground ${props.simpleMode ? "text-sm" : "font-mono text-[11px]"}`}
        >
          {`${formatTokenListAmount(solSubtitle)} SOL`}
        </p>
      )}
    </div>
  );
}
