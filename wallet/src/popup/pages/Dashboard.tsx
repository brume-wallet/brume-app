import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Refresh01Icon } from "@hugeicons/core-free-icons";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { ActionBar } from "../components/ActionBar";
import { BalanceCard } from "../components/BalanceCard";
import { BrumeIcon } from "../components/BrumeIcon";
import { TokenRow } from "../components/TokenRow";
import { getNativeSolDisplay } from "@/lib/token-metadata";
import { SOL_WRAPPED_MINT, isShieldFeatureEnabled } from "@/shared/constants";
import { useJupiterPortfolioPrices } from "../context/JupiterPortfolioPrices";
import { nativeSolTokenPath } from "../lib/native-sol-route";
import {
  fiatForPrivateLeg,
  privateRawPositive,
  rawToHuman,
  walletHumanFromRaw,
} from "../lib/private-balance-helpers";
import { sortPortfolioTokensByBalanceDesc } from "../lib/sort-portfolio-by-balance";
import { scheduleWalletStateRefresh } from "../lib/schedule-wallet-state-refresh";
import * as msg from "../messaging";
import { useWalletStore } from "../store";
import { cn } from "@/lib/utils";

export function Dashboard() {
  const { state, refresh } = useWalletStore();
  const {
    totalUsdApprox,
    totalPortfolioSolApprox,
    solFiatApprox,
    splFiatApprox,
    refetch: refetchUsdPrices,
  } = useJupiterPortfolioPrices();
  const [balanceRefreshing, setBalanceRefreshing] = useState(false);
  const [batchShieldByMint, setBatchShieldByMint] = useState<Record<
    string,
    string
  > | null>(null);
  const [privateBalanceTick, setPrivateBalanceTick] = useState(0);

  const solList = useMemo(
    () => getNativeSolDisplay(state?.network ?? "devnet"),
    [state?.network],
  );

  const sortedSpl = useMemo(
    () => sortPortfolioTokensByBalanceDesc(state?.portfolioTokens ?? []),
    [state?.portfolioTokens],
  );

  const splMintKey = useMemo(
    () => sortedSpl.map((t) => t.mint).sort().join(","),
    [sortedSpl],
  );

  const shieldEnabled = isShieldFeatureEnabled(state?.network ?? "devnet");

  const loadPrivateBalances = useCallback(async () => {
    if (!shieldEnabled) {
      setBatchShieldByMint({});
      return;
    }
    const mints = [...new Set([...sortedSpl.map((t) => t.mint), SOL_WRAPPED_MINT])];
    try {
      const map = await msg.getShieldBalancesBatch(mints);
      setBatchShieldByMint(map);
    } catch {
      setBatchShieldByMint(null);
    }
  }, [sortedSpl, shieldEnabled]);

  useEffect(() => {
    void loadPrivateBalances();
  }, [splMintKey, privateBalanceTick, loadPrivateBalances]);

  useEffect(() => {
    setBatchShieldByMint(null);
  }, [state?.publicKey, state?.network, splMintKey]);

  const privateByMint = shieldEnabled
    ? (batchShieldByMint ?? state?.shieldedBalancesByMint ?? {})
    : {};

  if (!state) return null;

  async function onRefreshBalance() {
    setBalanceRefreshing(true);
    try {
      await msg.refreshBalanceFromChain();
      scheduleWalletStateRefresh(async () => {
        await refresh();
        await refetchUsdPrices();
      });
    } finally {
      setBalanceRefreshing(false);
      setPrivateBalanceTick((n) => n + 1);
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-4 pt-2">
      {state.rpcError ? (
        <Alert className="rounded-2xl border-amber-500/35 bg-amber-500/10 text-amber-100">
          <AlertTitle className="text-amber-100">RPC blocked or unreachable</AlertTitle>
          <AlertDescription className="text-xs text-amber-100/85">
            Public Solana endpoints often return 403 from extensions. Add a
            provider URL (QuickNode, Alchemy, etc.) under Settings → RPC.
          </AlertDescription>
          <p className="mt-2 line-clamp-2 font-mono text-[10px] text-amber-200/90">
            {state.rpcError}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              className="h-8 rounded-xl text-xs"
              onClick={() =>
                void msg.refreshBalanceFromChain().then(() => refresh())
              }
            >
              Retry
            </Button>
            <Link
              to="/settings"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "inline-flex h-8 items-center rounded-xl border-border/80 px-3 text-xs",
              )}
            >
              RPC settings
            </Link>
          </div>
        </Alert>
      ) : null}

      {state.indexerError ? (
        <Alert className="rounded-2xl border-rose-500/35 bg-rose-500/10 text-rose-100">
          <AlertTitle className="text-rose-100">Brume API unreachable</AlertTitle>
          <AlertDescription className="text-xs text-rose-100/85">
            SPL names, logos, and activity come from the Next.js app. Run{" "}
            <code className="rounded bg-black/20 px-1">pnpm dev</code> at the
            repo root (API on port 3001) or set{" "}
            <code className="rounded bg-black/20 px-1">
              DEFAULT_BRUME_API_ORIGIN
            </code>{" "}
            in <code className="rounded bg-black/20 px-1">shared/constants.ts</code>{" "}
            to your deployed URL, then rebuild the extension.
          </AlertDescription>
          <p className="mt-2 line-clamp-3 font-mono text-[10px] text-rose-200/90">
            {state.indexerError}
          </p>
          <Button
            type="button"
            size="sm"
            className="mt-3 h-8 rounded-xl text-xs"
            onClick={() =>
              void msg.refreshBalanceFromChain().then(() => refresh())
            }
          >
            Retry
          </Button>
        </Alert>
      ) : null}

      <div className="relative px-1 pt-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="absolute right-0 top-3 z-[1] text-muted-foreground hover:text-foreground"
          aria-label="Refresh balance"
          disabled={balanceRefreshing}
          onClick={() => void onRefreshBalance()}
        >
          <BrumeIcon
            icon={Refresh01Icon}
            size={18}
            className={balanceRefreshing ? "animate-spin" : undefined}
          />
        </Button>
        <BalanceCard
          balanceSolBaseUnits={state.balanceSolBaseUnits}
          simpleMode={state.simpleMode}
          totalUsdApprox={totalUsdApprox}
          totalPortfolioSolApprox={totalPortfolioSolApprox}
        />
      </div>

      <ActionBar />

      <div className="border-b border-border pb-2 pt-2">
        <span className="text-[15px] font-semibold text-foreground">Tokens</span>
      </div>

      <TokenRow
        to={nativeSolTokenPath()}
        navState={{ tokenDetailBackTo: "/" }}
        symbol={solList.symbol}
        name={solList.name}
        amountRaw={state.balanceSolBaseUnits}
        decimals={solList.decimals}
        simpleMode={state.simpleMode}
        logoUri={solList.logoURI}
        verified={solList.fromRegistry}
        fiatUsdApprox={solFiatApprox}
      />

      {privateRawPositive(privateByMint[SOL_WRAPPED_MINT]) ? (
        <TokenRow
          key="sol-shielded"
          to={`/send/spl/${encodeURIComponent(SOL_WRAPPED_MINT)}`}
          navState={{
            sendBackTo: "/",
            fromPrivateBalance: true,
          }}
          symbol={solList.symbol}
          name={solList.name}
          amountRaw={privateByMint[SOL_WRAPPED_MINT] ?? "0"}
          decimals={solList.decimals}
          simpleMode={state.simpleMode}
          logoUri={solList.logoURI}
          verified={solList.fromRegistry}
          fiatUsdApprox={fiatForPrivateLeg(
            walletHumanFromRaw(state.balanceSolBaseUnits, solList.decimals),
            solFiatApprox,
            rawToHuman(privateByMint[SOL_WRAPPED_MINT] ?? "0", solList.decimals),
          )}
          forceShieldBadge
        />
      ) : null}

      {sortedSpl.length > 0
        ? sortedSpl.flatMap((t) => {
            const privRaw = privateByMint[t.mint];
            const out = [
              <TokenRow
                key={t.mint}
                to={`/token/${encodeURIComponent(t.mint)}`}
                navState={{ tokenDetailBackTo: "/" }}
                symbol={t.symbol}
                name={t.name}
                amountRaw={t.amountRaw}
                decimals={t.decimals}
                simpleMode={state.simpleMode}
                logoUri={t.logoUri}
                verified={false}
                fiatUsdApprox={splFiatApprox(t.mint)}
              />,
            ];
            if (privateRawPositive(privRaw)) {
              const wHum = walletHumanFromRaw(t.amountRaw, t.decimals);
              const pHum = rawToHuman(privRaw ?? "0", t.decimals);
              out.push(
                <TokenRow
                  key={`${t.mint}-shielded`}
                  to={`/send/spl/${encodeURIComponent(t.mint)}`}
                  navState={{
                    sendBackTo: "/",
                    fromPrivateBalance: true,
                  }}
                  symbol={t.symbol}
                  name={t.name}
                  amountRaw={privRaw ?? "0"}
                  decimals={t.decimals}
                  simpleMode={state.simpleMode}
                  logoUri={t.logoUri}
                  verified={false}
                  fiatUsdApprox={fiatForPrivateLeg(
                    wHum,
                    splFiatApprox(t.mint),
                    pHum,
                  )}
                  forceShieldBadge
                />,
              );
            }
            return out;
          })
        : null}
    </div>
  );
}
