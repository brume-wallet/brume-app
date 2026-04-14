import { useState } from "react";
import { Link } from "react-router-dom";
import { formatTokenListAmount } from "@/lib/utils";
import { PrivateLegAvatarBadge } from "./PrivateLegAvatarBadge";
import { VerifiedBadge } from "./VerifiedBadge";

function TokenAvatar(props: {
  symbol: string;
  logoUri?: string | null;
  className?: string;
}) {
  const { symbol, logoUri, className = "h-10 w-10" } = props;
  const [imgFailed, setImgFailed] = useState(false);
  const letter = symbol.charAt(0).toUpperCase();

  if (logoUri && !imgFailed) {
    return (
      <img
        src={logoUri}
        alt=""
        className={`${className} shrink-0 rounded-full object-cover ring-2 ring-primary/35`}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div
      className={`relative shrink-0 rounded-full bg-background ring-2 ring-primary/35 ${className}`}
    >
      <div
        className="absolute inset-1 rounded-full"
        style={{
          background:
            "conic-gradient(from 200deg, rgba(249,54,60,0.35), rgba(0,0,0,0.08), rgba(249,54,60,0.35))",
        }}
      />
      <div className="absolute inset-[3px] flex items-center justify-center rounded-full bg-card text-[11px] font-bold text-foreground">
        {letter}
      </div>
    </div>
  );
}

// Passed through React Router for back navigation on nested flows.

export type TokenRowNavState = {
  sendBackTo?: string;
  tokenDetailBackTo?: string;
    // Deep-link into Shield (e.g. from Send → Private balance).

  shieldTokenMint?: string;
  shieldInitialMode?: "shield" | "unshield";
    // Open SPL send spending shielded (ephemeral) balance.

  fromPrivateBalance?: boolean;
};

export function TokenRow(props: {
    // When set, the row navigates here (e.g. send flow).

  to?: string;
    // Optional `location.state` for the navigation (e.g. `{ sendBackTo: "/" }`).

  navState?: TokenRowNavState;
  symbol: string;
  name: string;
    // Integer string of smallest units (e.g. 10⁻⁹ SOL per unit for SOL).

  amountRaw: string | null;
  decimals?: number;
  simpleMode: boolean;
  logoUri?: string | null;
    // When true, show registry-style check (token is in the bundled Solana token list).

  verified?: boolean;
    // 
  // When set, show a secondary USD line (Jupiter spot where available).
  // Omit or null hides USD (e.g. token not listed on Jupiter).

  fiatUsdApprox?: number | null;
    // 
  // Ephemeral (shielded) balance from Payments API, smallest units.
  // When &gt; 0, shows the default shield badge (unless `forceShieldBadge` is false).

  privateBalanceRaw?: string | null;
    // 
  // When true, always show the shield badge (e.g. private-balance-only row on Send).
  // When false, never show it from this row even if `privateBalanceRaw` is set.

  forceShieldBadge?: boolean;
}) {
  const decimals = props.decimals ?? 9;
  const raw =
    props.amountRaw != null && props.amountRaw !== ""
      ? BigInt(props.amountRaw)
      : 0n;
  const divisor = 10n ** BigInt(decimals);
  const display = Number(raw) / Number(divisor);
  const verified = props.verified ?? false;

  let privateHuman: number | null = null;
  if (props.privateBalanceRaw != null && props.privateBalanceRaw !== "") {
    try {
      privateHuman =
        Number(BigInt(props.privateBalanceRaw)) /
        Number(10n ** BigInt(decimals));
    } catch {
      privateHuman = 0;
    }
  }

  const showPrivateBadge =
    props.forceShieldBadge === true ||
    (props.forceShieldBadge !== false &&
      privateHuman != null &&
      privateHuman > 0);

  const inner = (
    <>
      <div className="relative shrink-0 overflow-visible">
        <TokenAvatar symbol={props.symbol} logoUri={props.logoUri} />
        {showPrivateBadge ? <PrivateLegAvatarBadge /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[15px] font-semibold text-foreground">
            {props.name}
          </span>
          {verified ? <VerifiedBadge /> : null}
        </div>
        <p className="text-[13px] text-muted-foreground">
          {formatTokenListAmount(display)}{" "}
          {props.symbol}
        </p>
      </div>
      <div className="shrink-0 text-right">
        {props.fiatUsdApprox != null ? (
          <p className="text-[15px] font-medium text-foreground">
            ${props.fiatUsdApprox.toFixed(2)}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">—</p>
        )}
      </div>
    </>
  );

  const className =
    "flex items-center gap-3 rounded-2xl bg-card px-3 py-3 ring-1 ring-border/60 transition-colors duration-200 hover:ring-border";

  const privateTitle = showPrivateBadge
    ? props.forceShieldBadge
      ? "Shielded balance — tap to send"
      : "This token has a private (shielded) balance"
    : undefined;

  if (props.to) {
    return (
      <Link
        to={props.to}
        state={props.navState}
        title={privateTitle}
        className={`${className} block cursor-pointer no-underline outline-none focus-visible:ring-2 focus-visible:ring-ring`}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className={className} title={privateTitle}>
      {inner}
    </div>
  );
}
