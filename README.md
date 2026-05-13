# Velajuy Pelucas

Custom e-commerce for Velajuy Pelucas (Colombia). Single Next.js 16 app — storefront + admin.

## Quick start

    pnpm install
    cp .env.example .env.development
    pnpm db:migrate
    pnpm db:seed
    pnpm dev

## Scripts

- `pnpm dev` — dev server
- `pnpm build` / `pnpm start` — production
- `pnpm typecheck` — TS
- `pnpm lint` / `pnpm format` — code quality
- `pnpm test` — unit (Vitest)
- `pnpm test:e2e` — E2E (Playwright)
- `pnpm db:generate` — generate migration from schema diff
- `pnpm db:migrate` — apply pending migrations
- `pnpm db:seed` — seed dev data
- `pnpm db:studio` — Drizzle Studio
