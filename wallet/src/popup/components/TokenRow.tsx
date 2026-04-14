import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { formatTokenListAmount } from "@/lib/utils";
import { cn } from "@/lib/utils";
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

export type TokenRowNavState = {
  sendBackTo?: string;
  tokenDetailBackTo?: string;
  shieldTokenMint?: string;
  shieldInitialMode?: "shield" | "unshield";
  fromPrivateBalance?: boolean;
};

export function TokenRow(props: {
  to?: string;
  navState?: TokenRowNavState;
  symbol: string;
  name: string;
  amountRaw: string | null;
  decimals?: number;
  simpleMode: boolean;
  logoUri?: string | null;
  verified?: boolean;
  fiatUsdApprox?: number | null;
  privateBalanceRaw?: string | null;
  forceShieldBadge?: boolean;
  hideBalance?: boolean;
}) {
  const pixelFilterUid = useId().replace(/:/g, "");
  const pixelLgId = `brume-pixel-row-${pixelFilterUid}-lg`;
  const pixelSmId = `brume-pixel-row-${pixelFilterUid}-sm`;

  const decimals = props.decimals ?? 9;
  const raw =
    props.amountRaw != null && props.amountRaw !== ""
      ? BigInt(props.amountRaw)
      : 0n;
  const divisor = 10n ** BigInt(decimals);
  const display = Number(raw) / Number(divisor);
  const verified = props.verified ?? false;
  const hidden = props.hideBalance === true;

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
      {hidden ? (
        <svg
          aria-hidden
          className="pointer-events-none absolute h-0 w-0 overflow-hidden"
          width={0}
          height={0}
        >
          <defs>
            <filter id={pixelLgId} x="0" y="0" width="100%" height="100%">
              <feFlood x="4" y="4" height="2" width="2" />
              <feComposite width="10" height="10" />
              <feTile result="a" />
              <feComposite in="SourceGraphic" in2="a" operator="in" />
              <feMorphology operator="dilate" radius="5" />
            </filter>
            <filter id={pixelSmId} x="0" y="0" width="100%" height="100%">
              <feFlood x="3" y="3" height="2" width="2" />
              <feComposite width="8" height="8" />
              <feTile result="a" />
              <feComposite in="SourceGraphic" in2="a" operator="in" />
              <feMorphology operator="dilate" radius="4" />
            </filter>
          </defs>
        </svg>
      ) : null}
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
        <p
          className={cn(
            "text-[13px] text-muted-foreground",
            hidden && "text-[#c8c8cc]",
          )}
          style={
            hidden
              ? { filter: `url(#${pixelSmId})`, userSelect: "none" }
              : undefined
          }
        >
          {formatTokenListAmount(display)} {props.symbol}
        </p>
      </div>
      <div className="shrink-0 text-right">
        {props.fiatUsdApprox != null ? (
          <p
            className={cn(
              "text-[15px] font-medium text-foreground",
              hidden && "text-[#bbbbc0]",
            )}
            style={
              hidden
                ? { filter: `url(#${pixelLgId})`, userSelect: "none" }
                : undefined
            }
          >
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
        className={`${className} relative block cursor-pointer no-underline outline-none focus-visible:ring-2 focus-visible:ring-ring`}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className={`${className} relative`} title={privateTitle}>
      {inner}
    </div>
  );
}
