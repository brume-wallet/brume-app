# Brume

Solana wallet as a Chrome MV3 extension, plus a Next.js API for portfolio, activity, and token metadata. Monorepo: **pnpm** workspaces + **Turborepo**.

| Package | Path | Role |
|---------|------|------|
| `brume-wallet` | `wallet/` | Extension — React UI, service worker, injected `window.solana` |
| `@brume/api` | `app/` | Next.js 15 — Helius DAS, Prisma + Supabase Postgres |
| `@brume/shared` | `shared/` | Types and constants for wallet + API |

## Prerequisites

- **Node.js** 20+
- **pnpm** 9.x (`corepack enable && corepack prepare pnpm@9 --activate`)
- **Chrome** (unpacked extension dev)

## Quick start

```bash
git clone https://github.com/brume-wallet/brume-app.git brume && cd brume
pnpm install
pnpm build          # shared → wallet + app
pnpm dev            # wallet Vite + API on http://localhost:3001
```

Load the extension: Chrome → `chrome://extensions` → Developer mode → **Load unpacked** → choose `wallet/dist` (after `pnpm dev` or `pnpm build` in `wallet/`).

## Wallet

```bash
cd wallet
pnpm dev            # hot reload
pnpm build          # production → dist/
```

## API

```bash
cd app
cp .env.example .env.local    # fill values below
pnpm db:push                  # schema to Postgres (needs DIRECT_URL)
pnpm dev                      # :3001
```

### Environment

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | Yes | Supabase **pooler** (port 6543, `pgbouncer=true`) for the app |
| `DIRECT_URL` | For `db push` | **Direct** Postgres (host `db.<ref>.supabase.co`, port 5432, user `postgres`) |
| `HELIUS_API_KEY` | No | DAS + richer history; else public RPC |
| `DEVNET_RPC_URL` / `MAINNET_RPC_URL` | No | Override defaults |

Password in URLs must be percent-encoded; pooler URL is not the same as direct — see [Supabase connection docs](https://supabase.com/docs/guides/database/connecting-to-postgres).

### Routes

| Path | Method | Purpose |
|------|--------|---------|
| `/api/health` | GET | Health |
| `/api/tokens/portfolio?owner=<address>` | GET | Balances + metadata |
| `/api/tokens/metadata/<mint>` | GET | One mint |
| `/api/activity/<address>` | GET | Parsed history |

CORS is restricted to the extension and known hosts; rate limit ~180 req/min per IP.

## Shared package

`@brume/shared` is consumed via `workspace:*`. Typecheck: `cd shared && pnpm build` (`tsc --noEmit`).

## Root scripts

| Command | Effect |
|---------|--------|
| `pnpm install` | All workspace packages |
| `pnpm build` | Dependency order via `turbo.json` |
| `pnpm dev` | Parallel dev tasks |
| `pnpm lint` | All linters |

## Layout

```
app/          Next.js API, Prisma, src/app/api/*
wallet/       manifest, Vite, src/{background,content,popup,...}
shared/       src/* types & constants
turbo.json    task graph
pnpm-workspace.yaml
```

## Smoke test

Create wallet → devnet → airdrop → send → on a `https://` page: `await window.solana.connect()` → lock/unlock.

## Troubleshooting

- **Service worker error (e.g. code 15)** — `chrome://extensions` → Errors on the extension card; after git pull: `pnpm install`, rebuild, reload extension.
- **`process is not defined` in wallet** — Node-only dep in the bundle; wallet should use browser-safe crypto (`@noble/*`, `@scure/*`). Check `vite.config.ts` aliases/defines.
- **403 / CORS on API** — Use API on `localhost:3001`; extension `host_permissions` must allow your dev origin.

## Security

Non-audited dev wallet. Do not use mainnet funds you cannot lose. dApp origin comes from `chrome.runtime.MessageSender`, not page-controlled strings.

## License

No root license file yet — add one before publishing.
