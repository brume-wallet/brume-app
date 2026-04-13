import { BRUME_GITHUB_REPO_URL } from "@brume/shared";
import Image from "next/image";
import Link from "next/link";

const GITHUB = BRUME_GITHUB_REPO_URL;

const IMG_PRIVACY =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDsum1ywwSsFMq4OetMC8n3Guccgiiui4uwGuM47sqhFVovUn1uGkALOa25TO85PUPdcY6OhYvEqaC_df17DrSQq4OHCH8Nbz4ZuvNvQUii5YH-IEjhB_2lnCfIJu6TvbFuUGxfry8RFOlLnalytd5y1IsXlmNzf9MdIXA7YyGKOZIEiNY-BUK9Y_JKUGVNn0RzfTGU6w2Be_qsSRWocpoyC52vCeXzW80jZ8_aL2P5iGqFab_qeXPRtKMcVAribYjvU1TjgLAH1Qbs";

const IMG_CTA =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBZGIX5_h35-SkUOArjUvk-241VpPaiUXVXJd17Hh2rco43tpxwR3HSUlpmddhokRjqE3moTzwb3ujHkA_6nAwYsvHSWcO35-Nqrp-sg4-FMn_R79UDCsw5CXu6BvoXMdMu5H8skWtakO-AmcGlbqeH13aAfZr6_G7kcnYSIMZvdLRHU7nCSRzLsGZKbsnVOy2_YbVaUc1mS-sI3ECVkN3yyQlGXc5N1iWo2zDvq7YGufZ0ezghRI0t37SmYaGK3MRNlFabqGWXu-nP";

function IconSecurity({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
    </svg>
  );
}

function IconRobot({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M20 9V7c0-1.1-.9-2-2-2h-2V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v1H8c-1.1 0-2 .9-2 2v2h14V9zM9 5h2v2H9V5zm0 11H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm4-5v9H5v-9h14z" />
    </svg>
  );
}

function IconBolt({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.62 12 4c1.58 3.62 3.52 6.94 4.81 8.22.02.04.26.44.07.12-.19-.34-.2-.66.38-.66H13l1 7h-1v2z" />
    </svg>
  );
}

function IconArrowForward({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" />
    </svg>
  );
}

function IconTune({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" />
    </svg>
  );
}

function IconOpenInNew({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
    </svg>
  );
}

function IconVerified({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
    </svg>
  );
}

function IconGitHub({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.82 1.102.82 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

const MODULES = ["DCA", "Staking", "Lending", "Flash Loans"] as const;

const NAV_LINKS = ["Security", "Assets", "Ecosystem", "Governance"] as const;

export function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-brume-void">
      <nav className="fixed top-0 z-50 w-full border-b border-white/[0.04] bg-slate-950/60 pt-safe shadow-nav backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-[1152px] items-center justify-between gap-2 px-4 sm:h-20 sm:gap-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="min-w-0 shrink font-display text-xl italic tracking-tight text-slate-50 sm:text-2xl"
          >
            Brume
          </Link>
          <div className="hidden items-center gap-6 lg:gap-8 md:flex">
            {NAV_LINKS.map((label) => (
              <a
                key={label}
                href={`#${label.toLowerCase()}`}
                className="font-sans text-xs font-medium uppercase tracking-widest text-slate-400 transition-colors duration-500 hover:text-slate-50 lg:text-sm"
              >
                {label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <details className="relative md:hidden">
              <summary className="flex cursor-pointer list-none items-center rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-300 transition-colors hover:border-white/20 hover:text-white [&::-webkit-details-marker]:hidden">
                Menu
              </summary>
              <div
                className="absolute right-0 top-[calc(100%+0.5rem)] z-50 flex min-w-[12.5rem] flex-col gap-1 rounded-xl border border-white/10 bg-slate-950/95 p-2 shadow-xl backdrop-blur-xl"
                role="menu"
              >
                {NAV_LINKS.map((label) => (
                  <a
                    key={label}
                    href={`#${label.toLowerCase()}`}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                    role="menuitem"
                  >
                    {label}
                  </a>
                ))}
              </div>
            </details>
            <a
              href="#get-brume"
              className="shrink-0 rounded-full bg-primary px-3 py-2 text-xs font-medium text-on-primary transition-all duration-300 hover:brightness-110 active:scale-[0.98] sm:px-6 sm:py-2.5 sm:text-sm"
            >
              <span className="hidden min-[380px]:inline">Get Brume</span>
              <span className="min-[380px]:hidden">Get</span>
            </a>
          </div>
        </div>
      </nav>

      <main className="relative">
        <section className="relative mx-auto max-w-[1152px] overflow-visible px-4 pb-20 pt-28 sm:px-6 sm:pb-28 sm:pt-36 md:px-8 md:pb-32 md:pt-44 lg:pt-48">
          <div
            className="pointer-events-none absolute left-1/2 top-[-4rem] -z-10 h-[min(100vw,42rem)] w-[min(100vw,42rem)] -translate-x-1/2 brume-glow-overlay sm:top-[-6rem] sm:h-[min(100vw,48rem)] sm:w-[min(100vw,48rem)] md:top-[-10rem] md:h-[800px] md:w-[800px]"
            aria-hidden
          />
          <div className="flex max-w-3xl flex-col items-start gap-6 sm:gap-8">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-primary sm:text-xs">
                brume.cash
              </span>
              <div
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-secondary shadow-[0_0_8px_#4ddcc6]"
                aria-hidden
              />
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500 sm:text-xs">
                Solana
              </span>
            </div>
            <h1 className="break-words font-display text-[clamp(2.125rem,9.5vw,5.5rem)] font-normal italic leading-[0.98] tracking-tight text-white sm:leading-[0.95] lg:text-7xl xl:text-8xl">
              Public is the feature you opt into.
            </h1>
            <p className="max-w-xl text-base font-light leading-relaxed text-on-surface-variant sm:text-lg md:text-xl">
              Sovereignty through silence. Shielded transfers and agentic rules
              built directly into the core of your wallet. No compromises.
            </p>
            <div className="mt-2 flex w-full max-w-md flex-col gap-3 sm:mt-4 sm:max-w-none sm:flex-row sm:flex-wrap sm:gap-4">
              <a
                href="#get-brume"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-6 py-3.5 text-sm font-semibold text-on-primary shadow-lg shadow-primary/10 transition-all hover:shadow-primary/20 sm:w-auto sm:px-8 sm:py-4"
              >
                Get Brume
                <IconArrowForward className="h-[1.125rem] w-[1.125rem] transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href={GITHUB}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center rounded-xl border border-outline-variant bg-transparent px-6 py-3.5 text-sm font-semibold text-on-surface transition-all hover:bg-white/5 sm:w-auto sm:px-8 sm:py-4"
              >
                View source
              </a>
            </div>
          </div>
        </section>

        <div
          id="security"
          className="mb-20 w-full select-none overflow-hidden bg-[#f5e0a4] sm:mb-28 md:mb-32"
        >
          <div className="mx-auto flex max-w-[1152px] flex-col divide-y divide-slate-900/15 px-4 py-1 sm:px-6 md:flex-row md:items-center md:justify-between md:divide-y-0 md:py-4 lg:px-8">
            <div className="flex items-center justify-center gap-3 py-4 text-xs font-bold uppercase tracking-tighter text-slate-900 sm:justify-start sm:text-sm md:flex-1 md:py-0 md:text-base">
              <IconSecurity className="h-5 w-5 shrink-0" />
              Private by default
            </div>
            <div
              id="assets"
              className="flex items-center justify-center gap-3 py-4 text-xs font-bold uppercase tracking-tighter text-slate-900 sm:justify-start sm:text-sm md:flex-1 md:py-0 md:text-base"
            >
              <IconRobot className="h-5 w-5 shrink-0" />
              Agents under policy
            </div>
            <div
              id="ecosystem"
              className="flex items-center justify-center gap-3 py-4 text-xs font-bold uppercase tracking-tighter text-slate-900 sm:justify-start sm:text-sm md:flex-1 md:py-0 md:text-base"
            >
              <IconBolt className="h-5 w-5 shrink-0" />
              Solana first
            </div>
          </div>
        </div>

        <section
          id="governance"
          className="mx-auto mb-32 max-w-[1152px] px-4 sm:mb-40 sm:px-6 md:mb-48 md:px-8"
        >
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 md:auto-rows-[minmax(240px,auto)] lg:auto-rows-[minmax(280px,auto)]">
            <div className="group relative flex min-h-0 flex-col justify-between gap-6 overflow-hidden rounded-xl bg-surface-container-low p-6 sm:p-8 md:col-span-1 md:row-span-2 md:min-h-[32rem] lg:p-10">
              <div
                className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl transition-all duration-700 group-hover:bg-primary/20"
                aria-hidden
              />
              <div className="relative z-10">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-1">
                  <span className="h-2 w-2 rounded-full bg-secondary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    shielded · default on
                  </span>
                </div>
                <h3 className="mb-3 font-display text-3xl italic text-white sm:mb-4 sm:text-4xl">
                  Privacy default
                </h3>
                <p className="font-light leading-relaxed text-on-surface-variant">
                  Every transaction is shielded from inception. We don&apos;t
                  ask if you want privacy; we assume you deserve it.
                </p>
              </div>
              <Image
                src={IMG_PRIVACY}
                alt=""
                width={640}
                height={192}
                className="mt-8 h-48 w-full rounded-lg object-cover opacity-60 mix-blend-screen grayscale transition-all duration-1000 hover:grayscale-0"
                unoptimized
              />
            </div>

            <div className="flex min-h-[220px] flex-col justify-between rounded-xl border border-white/5 bg-surface-container-low p-6 sm:min-h-0 sm:p-8 md:col-span-1">
              <div>
                <h3 className="mb-2 font-display text-xl italic text-white sm:text-2xl">
                  Agentic wallets
                </h3>
                <p className="text-sm font-light text-on-surface-variant">
                  Delegate complex actions to policy-bound agents. Set strict
                  rules, automate your flow, and revoke access instantly.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                Policy Control <IconTune className="h-4 w-4" />
              </div>
            </div>

            <div className="flex min-h-[220px] flex-col justify-between rounded-xl bg-surface-container-high p-6 sm:min-h-0 sm:p-8 md:col-span-1">
              <div>
                <h3 className="mb-2 font-display text-xl italic text-white sm:text-2xl">
                  Honest disclosure
                </h3>
                <p className="text-sm font-light text-on-surface-variant">
                  Privacy has limits. We are transparent about the cryptographic
                  bounds of the Solana network and our shielding modules.
                </p>
              </div>
              <Link
                href="/developers"
                className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-tertiary transition hover:opacity-90"
              >
                Protocol docs <IconOpenInNew className="h-4 w-4" />
              </Link>
            </div>

            <div className="flex flex-col justify-center rounded-xl border border-white/[0.03] bg-surface-container-lowest p-6 sm:p-8 md:col-span-2 md:p-10">
              <h3 className="mb-4 font-display text-2xl italic text-white sm:mb-6 sm:text-3xl">
                Same rails, more modules
              </h3>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {MODULES.map((label) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 sm:gap-3 sm:px-6 sm:py-3"
                  >
                    <span className="text-xs font-medium text-on-surface sm:text-sm">
                      {label}
                    </span>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[9px] font-bold uppercase tracking-tighter text-slate-500">
                      coming soon
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="get-brume"
          className="mx-auto mb-24 max-w-[1152px] px-4 sm:mb-28 sm:px-6 md:mb-32 md:px-8"
        >
          <div className="relative overflow-hidden rounded-xl bg-surface-container-high p-8 sm:p-12 md:p-16 lg:p-20">
            <div className="pointer-events-none absolute inset-0 opacity-[0.08] sm:opacity-10 md:inset-y-0 md:left-auto md:right-0 md:w-1/2 md:opacity-20">
              <Image
                src={IMG_CTA}
                alt=""
                fill
                className="object-cover object-right"
                sizes="(max-width: 768px) 100vw, 50vw"
                unoptimized
              />
            </div>
            <div className="relative z-10 max-w-xl">
              <h2 className="mb-4 font-display text-4xl italic leading-tight text-white sm:mb-6 sm:text-5xl">
                Get Brume
              </h2>
              <p className="mb-8 text-base font-light leading-relaxed text-on-surface-variant sm:mb-10 sm:text-lg">
                The extension is shipping soon. In the meantime, audit the code
                or explore our developer documentation to see how we handle
                your keys.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <a
                  href={GITHUB}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-primary px-6 py-3.5 text-center text-sm font-bold text-on-primary transition-all hover:brightness-110 sm:px-8 sm:py-4"
                >
                  Build from GitHub
                </a>
                <Link
                  href="/developers"
                  className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-6 py-3.5 text-center text-sm font-bold text-on-surface transition-all hover:bg-white/5 sm:px-8 sm:py-4"
                >
                  API docs
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-3">
                <IconVerified className="h-4 w-4 text-secondary" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Open source since day one
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-white/5 bg-brume-void pb-safe pt-16 sm:pt-20">
        <div className="mx-auto max-w-[1152px] px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col gap-10 sm:mb-16 md:flex-row md:items-start md:justify-between md:gap-12">
            <div className="max-w-md">
              <div className="mb-3 font-display text-2xl italic tracking-tight text-slate-200 sm:mb-4 sm:text-3xl">
                Brume
              </div>
              <p className="font-sans text-xs uppercase tracking-[0.2em] text-slate-500 sm:text-sm">
                Privacy-first Solana wallet · brume.cash
              </p>
            </div>
            <div className="grid w-full grid-cols-2 gap-x-8 gap-y-10 sm:max-w-lg sm:grid-cols-3 md:w-auto md:max-w-none md:flex md:gap-12">
              <div className="flex flex-col gap-3 sm:gap-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Protocol
                </span>
                <span className="text-sm font-medium text-slate-500">
                  Disclosure matrix (docs)
                </span>
              </div>
              <div className="flex flex-col gap-3 sm:gap-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Developers
                </span>
                <a
                  href={GITHUB}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-slate-500 transition-all hover:text-primary"
                >
                  GitHub
                </a>
                <Link
                  href="/developers"
                  className="text-sm font-medium text-slate-500 transition-all hover:text-primary"
                >
                  Documentation
                </Link>
              </div>
              <div className="col-span-2 flex flex-col gap-3 sm:col-span-1 sm:gap-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Legal
                </span>
                <span className="text-sm font-medium text-slate-500">
                  Privacy · Terms (soon)
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-between gap-6 border-t border-white/5 pt-8 sm:flex-row sm:gap-8 sm:pt-12">
            <p className="text-center font-sans text-[10px] uppercase tracking-widest text-slate-600 sm:text-left sm:text-xs">
              © 2026 Brume. Sovereignty through silence.
            </p>
            <div className="flex gap-6">
              <a
                href={GITHUB}
                target="_blank"
                rel="noreferrer"
                className="text-slate-500 transition-colors hover:text-white"
                aria-label="GitHub"
              >
                <IconGitHub className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
