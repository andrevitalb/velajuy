# Velajuy Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the Velajuy Pelucas project — single Next.js app with the full database schema migrated, auth wired (customer + admin), base storefront/admin layout shells, and seed data — so Plans 2-5 can build features on a working foundation.

**Architecture:** Single Next.js 16 App Router application. Storefront under `/`, admin under `/admin/*` route group with role-based gating. Postgres + Drizzle ORM (one schema file per entity-group, re-exported from `src/lib/db/schema/index.ts`). better-auth provides magic-link auth for both customers and admin (separated by `users.role`). Tailwind v4 with brand color tokens declared as CSS variables via `@theme`.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.7, Tailwind CSS 4, Drizzle ORM, postgres-js, Neon Postgres, better-auth, Zod, Vitest, Playwright, pnpm, Prettier (tabs, no semis, double quotes), ESLint.

---

## File Structure (created/touched in this plan)

```
velajuy/
├── .env.example                      [create] checked-in env template
├── .env.development                  [create, gitignored] local dev values
├── .gitignore                        [modify] add node_modules, .next, etc.
├── .prettierrc.json                  [create]
├── .prettierignore                   [create]
├── eslint.config.mjs                 [create]
├── package.json                      [create]
├── pnpm-workspace.yaml               [create] (declares root only)
├── tsconfig.json                     [create]
├── next.config.ts                    [create]
├── postcss.config.mjs                [create]
├── drizzle.config.ts                 [create]
├── playwright.config.ts              [create]
├── vitest.config.ts                  [create]
├── README.md                         [create]
├── public/
│   └── placeholder.png               [create] placeholder for products without image
└── src/
    ├── app/
    │   ├── layout.tsx                [create] root layout (fonts, providers, html lang="es-CO")
    │   ├── globals.css               [create] Tailwind v4 + @theme tokens
    │   ├── page.tsx                  [create] Inicio placeholder
    │   ├── (storefront)/
    │   │   ├── layout.tsx            [create] storefront chrome (header + footer)
    │   │   └── catalogo/page.tsx     [create] PLP placeholder ("Próximamente")
    │   ├── ingresar/page.tsx         [create] customer magic-link login
    │   ├── cuenta/page.tsx           [create] gated customer area placeholder
    │   ├── admin/
    │   │   ├── layout.tsx            [create] admin chrome + role gate
    │   │   ├── page.tsx              [create] Dashboard placeholder
    │   │   └── ingresar/page.tsx     [create] admin magic-link login
    │   └── api/auth/[...all]/route.ts [create] better-auth handler
    ├── components/
    │   ├── storefront/
    │   │   ├── header.tsx            [create]
    │   │   └── footer.tsx            [create]
    │   └── admin/
    │       ├── shell.tsx             [create] sidebar + topbar wrapper
    │       └── sidebar.tsx           [create]
    └── lib/
        ├── env.ts                    [create] zod-validated env
        ├── money.ts                  [create] COP minor-units + Intl formatting
        ├── auth.ts                   [create] better-auth server config
        ├── auth-client.ts            [create] better-auth client
        └── db/
            ├── index.ts              [create] drizzle client
            ├── seed.ts               [create] settings + zones + owner user
            └── schema/
                ├── index.ts          [create] re-exports
                ├── auth.ts           [create] better-auth tables (sessions, accounts, verification)
                ├── users.ts          [create] users (role enum)
                ├── addresses.ts      [create]
                ├── products.ts       [create]
                ├── product-images.ts [create]
                ├── attributes.ts     [create] attributes, attribute_values, product_attribute_values
                ├── carts.ts          [create] carts, cart_items
                ├── orders.ts         [create] orders, order_items
                ├── stock-movements.ts [create]
                ├── shipping-zones.ts [create]
                ├── payments.ts       [create] payments, webhook_events
                ├── wishlist.ts       [create]
                ├── back-in-stock.ts  [create]
                ├── pages.ts          [create]
                ├── settings.ts       [create]
                └── fx-rates.ts       [create]
└── tests/
    ├── unit/
    │   └── money.test.ts             [create]
    └── e2e/
        ├── homepage.spec.ts          [create]
        ├── admin-gate.spec.ts        [create]
        └── customer-login.spec.ts    [create]
```

Schema files split by responsibility: each entity-group (catalog, commerce, content) gets its own file so they can be modified independently in later plans without merge conflicts.

---

## Tasks

### Task 1: Bootstrap Next.js + TypeScript + Tailwind + tooling

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore`, `.gitignore`, `README.md`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`

- [ ] **Step 1: Initialize package.json**

Create `package.json`:

```json
{
  "name": "velajuy",
  "version": "0.0.0",
  "private": true,
  "packageManager": "pnpm@9.12.0",
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx src/lib/db/seed.ts"
  },
  "dependencies": {
    "better-auth": "^1.1.0",
    "drizzle-orm": "^0.36.0",
    "next": "16.0.0",
    "postgres": "^3.4.5",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.48.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "drizzle-kit": "^0.28.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "16.0.0",
    "prettier": "^3.3.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create pnpm workspace marker**

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - "."
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create next.config.ts**

```ts
import type { NextConfig } from "next"

const config: NextConfig = {
  experimental: {
    typedRoutes: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "*.r2.dev" },
    ],
  },
}

export default config
```

- [ ] **Step 5: Tailwind v4 PostCSS config**

`postcss.config.mjs`:

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
}
```

- [ ] **Step 6: ESLint config**

`eslint.config.mjs`:

```js
import { FlatCompat } from "@eslint/eslintrc"

const compat = new FlatCompat({ baseDirectory: import.meta.dirname })

export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
]
```

- [ ] **Step 7: Prettier**

`.prettierrc.json`:

```json
{
  "useTabs": true,
  "semi": false,
  "singleQuote": false,
  "trailingComma": "all",
  "arrowParens": "always",
  "printWidth": 100
}
```

`.prettierignore`:

```
.next
node_modules
pnpm-lock.yaml
public
drizzle
```

- [ ] **Step 8: .gitignore**

```
node_modules
.next
out
.env
.env.local
.env.*.local
.env.development
.DS_Store
*.log
.vscode
.idea
playwright-report
test-results
.superpowers/
```

- [ ] **Step 9: README.md**

```md
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
```

- [ ] **Step 10: Root layout with es-CO locale**

`src/app/layout.tsx`:

```tsx
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
	title: "Velajuy Pelucas",
	description: "Pelucas en Colombia — Velajuy",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="es-CO">
			<body className="bg-velajuy-pink-soft text-velajuy-wine antialiased">{children}</body>
		</html>
	)
}
```

- [ ] **Step 11: Tailwind v4 + brand tokens**

`src/app/globals.css`:

```css
@import "tailwindcss";

@theme {
	--color-velajuy-pink: #f4b6c2;
	--color-velajuy-pink-soft: #fde2ea;
	--color-velajuy-pink-bg: #fff5f8;
	--color-velajuy-wine: #5c1a2a;
	--color-velajuy-wine-soft: #7a3d4d;
	--color-velajuy-cream: #fffaf5;

	--font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
```

- [ ] **Step 12: Placeholder home page**

`src/app/page.tsx`:

```tsx
export default function HomePage() {
	return (
		<main className="mx-auto max-w-3xl px-6 py-24">
			<h1 className="text-4xl font-bold text-velajuy-wine">Velajuy Pelucas</h1>
			<p className="mt-4 text-velajuy-wine-soft">Próximamente.</p>
		</main>
	)
}
```

- [ ] **Step 13: Install + verify**

```bash
cd /Users/andrevital/Documents/work_stuff/av/velajuy
pnpm install
pnpm typecheck
pnpm dev
```

Expected: `pnpm dev` serves http://localhost:3000 showing "Velajuy Pelucas — Próximamente." with pink background. Stop with Ctrl-C.

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "feat: bootstrap next.js + tailwind + tooling"
```

---

### Task 2: Environment validation + Postgres + Drizzle client

**Files:**
- Create: `.env.example`, `.env.development`, `src/lib/env.ts`, `src/lib/db/index.ts`, `drizzle.config.ts`

- [ ] **Step 1: Create `.env.example`**

```
# Database
DATABASE_URL=postgres://user:password@localhost:5432/velajuy

# Auth
BETTER_AUTH_SECRET=replace-me-with-openssl-rand-base64-32
BETTER_AUTH_URL=http://localhost:3000

# Email (later)
RESEND_API_KEY=
EMAIL_FROM=noreply@velajuy.com

# Payments (later)
WOMPI_PUBLIC_KEY=
WOMPI_PRIVATE_KEY=
WOMPI_EVENT_SECRET=
MP_ACCESS_TOKEN=
MP_WEBHOOK_SECRET=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=

# Storage (later)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=velajuy-prod
R2_PUBLIC_URL=

# Observability (later)
SENTRY_DSN=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

- [ ] **Step 2: Create local `.env.development`**

Copy `.env.example` to `.env.development` and fill `DATABASE_URL` with a local or Neon dev URL. Generate `BETTER_AUTH_SECRET`:

```bash
cp .env.example .env.development
openssl rand -base64 32
```

Paste the random output into `BETTER_AUTH_SECRET` in `.env.development`.

- [ ] **Step 3: Failing test — env validation**

Create `tests/unit/env.test.ts`:

```ts
import { describe, expect, it } from "vitest"

describe("env", () => {
	it("rejects missing DATABASE_URL", async () => {
		const orig = process.env.DATABASE_URL
		delete process.env.DATABASE_URL
		await expect(import("@/lib/env")).rejects.toThrow(/DATABASE_URL/)
		process.env.DATABASE_URL = orig
	})
})
```

- [ ] **Step 4: Run — should fail (module doesn't exist yet)**

```bash
pnpm test -- env.test
```

Expected: FAIL — "Cannot find module '@/lib/env'".

- [ ] **Step 5: Implement env validation**

`src/lib/env.ts`:

```ts
import { z } from "zod"

const schema = z.object({
	DATABASE_URL: z.string().url(),
	BETTER_AUTH_SECRET: z.string().min(32),
	BETTER_AUTH_URL: z.string().url(),
	NEXT_PUBLIC_APP_URL: z.string().url(),
	NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
	const issues = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n")
	throw new Error(`Invalid environment variables:\n${issues}`)
}

export const env = parsed.data
```

- [ ] **Step 6: Vitest config**

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config"
import path from "node:path"

export default defineConfig({
	test: {
		environment: "node",
		include: ["tests/unit/**/*.test.ts"],
	},
	resolve: {
		alias: { "@": path.resolve(__dirname, "./src") },
	},
})
```

- [ ] **Step 7: Run test — passes**

```bash
pnpm test -- env.test
```

Expected: PASS.

- [ ] **Step 8: Drizzle config**

`drizzle.config.ts`:

```ts
import "dotenv/config"
import { defineConfig } from "drizzle-kit"

export default defineConfig({
	schema: "./src/lib/db/schema/index.ts",
	out: "./drizzle",
	dialect: "postgresql",
	dbCredentials: { url: process.env.DATABASE_URL! },
	casing: "snake_case",
})
```

Install dotenv: `pnpm add -D dotenv`.

- [ ] **Step 9: Drizzle client**

`src/lib/db/index.ts`:

```ts
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { env } from "@/lib/env"
import * as schema from "./schema"

const queryClient = postgres(env.DATABASE_URL, { prepare: false })

export const db = drizzle(queryClient, { schema, casing: "snake_case" })
export type DB = typeof db
```

- [ ] **Step 10: Empty schema barrel**

`src/lib/db/schema/index.ts`:

```ts
// Re-exports populated as schemas are added in later tasks.
export {}
```

- [ ] **Step 11: Verify typecheck**

```bash
pnpm typecheck
```

Expected: clean.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: env validation and drizzle client"
```

---

### Task 3: Schema — auth tables + users

**Files:**
- Create: `src/lib/db/schema/auth.ts`, `src/lib/db/schema/users.ts`
- Modify: `src/lib/db/schema/index.ts`

- [ ] **Step 1: Users table**

`src/lib/db/schema/users.ts`:

```ts
import { pgEnum, pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core"

export const userRole = pgEnum("user_role", ["customer", "staff", "owner"])

export const users = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull().default(false),
	name: text("name"),
	phone: text("phone"),
	role: userRole("role").notNull().default("customer"),
	image: text("image"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
```

- [ ] **Step 2: better-auth tables**

`src/lib/db/schema/auth.ts`:

```ts
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { users } from "./users"

export const sessions = pgTable("sessions", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	token: text("token").notNull().unique(),
	expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const accounts = pgTable("accounts", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	providerId: text("provider_id").notNull(),
	accountId: text("account_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	password: text("password"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const verifications = pgTable("verifications", {
	id: uuid("id").primaryKey().defaultRandom(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})
```

- [ ] **Step 3: Re-export from barrel**

`src/lib/db/schema/index.ts`:

```ts
export * from "./users"
export * from "./auth"
```

- [ ] **Step 4: Typecheck**

```bash
pnpm typecheck
```

Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(db): users and auth schemas"
```

---

### Task 4: Schema — addresses, catalog (products, images, attributes)

**Files:**
- Create: `src/lib/db/schema/addresses.ts`, `src/lib/db/schema/products.ts`, `src/lib/db/schema/product-images.ts`, `src/lib/db/schema/attributes.ts`
- Modify: `src/lib/db/schema/index.ts`

- [ ] **Step 1: Addresses**

`src/lib/db/schema/addresses.ts`:

```ts
import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { users } from "./users"

export const addresses = pgTable("addresses", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
	recipientName: text("recipient_name").notNull(),
	phone: text("phone").notNull(),
	country: text("country").notNull().default("CO"),
	department: text("department").notNull(),
	city: text("city").notNull(),
	line1: text("line1").notNull(),
	line2: text("line2"),
	neighborhood: text("neighborhood"),
	postalCode: text("postal_code"),
	notes: text("notes"),
	isDefault: boolean("is_default").notNull().default(false),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export type Address = typeof addresses.$inferSelect
export type NewAddress = typeof addresses.$inferInsert
```

- [ ] **Step 2: Products**

`src/lib/db/schema/products.ts`:

```ts
import {
	bigint,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core"

export const productStatus = pgEnum("product_status", ["draft", "active", "archived"])

export const products = pgTable("products", {
	id: uuid("id").primaryKey().defaultRandom(),
	slug: text("slug").notNull().unique(),
	name: text("name").notNull(),
	shortDescription: text("short_description"),
	description: text("description"), // serialized rich text JSON (string)
	status: productStatus("status").notNull().default("draft"),
	priceAmount: bigint("price_amount", { mode: "number" }).notNull(), // minor units
	priceCurrency: text("price_currency").notNull().default("COP"),
	weightGrams: integer("weight_grams"),
	primaryImageId: uuid("primary_image_id"),
	stockQuantity: integer("stock_quantity").notNull().default(0),
	lowStockThreshold: integer("low_stock_threshold").notNull().default(2),
	skuCode: text("sku_code"),
	dianTaxRate: integer("dian_tax_rate").notNull().default(19),
	dianClassification: text("dian_classification"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
```

- [ ] **Step 3: Product images**

`src/lib/db/schema/product-images.ts`:

```ts
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { products } from "./products"

export const productImages = pgTable("product_images", {
	id: uuid("id").primaryKey().defaultRandom(),
	productId: uuid("product_id")
		.notNull()
		.references(() => products.id, { onDelete: "cascade" }),
	url: text("url").notNull(),
	altText: text("alt_text"),
	sortOrder: integer("sort_order").notNull().default(0),
	width: integer("width"),
	height: integer("height"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
```

- [ ] **Step 4: Attributes**

`src/lib/db/schema/attributes.ts`:

```ts
import { integer, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { products } from "./products"

export const attributes = pgTable("attributes", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(),
	sortOrder: integer("sort_order").notNull().default(0),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const attributeValues = pgTable("attribute_values", {
	id: uuid("id").primaryKey().defaultRandom(),
	attributeId: uuid("attribute_id")
		.notNull()
		.references(() => attributes.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	slug: text("slug").notNull(),
	sortOrder: integer("sort_order").notNull().default(0),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const productAttributeValues = pgTable(
	"product_attribute_values",
	{
		productId: uuid("product_id")
			.notNull()
			.references(() => products.id, { onDelete: "cascade" }),
		attributeValueId: uuid("attribute_value_id")
			.notNull()
			.references(() => attributeValues.id, { onDelete: "cascade" }),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.productId, t.attributeValueId] }),
	}),
)
```

- [ ] **Step 5: Update barrel**

`src/lib/db/schema/index.ts`:

```ts
export * from "./users"
export * from "./auth"
export * from "./addresses"
export * from "./products"
export * from "./product-images"
export * from "./attributes"
```

- [ ] **Step 6: Typecheck + commit**

```bash
pnpm typecheck
git add -A
git commit -m "feat(db): catalog and address schemas"
```

---

### Task 5: Schema — carts, orders, stock movements

**Files:**
- Create: `src/lib/db/schema/carts.ts`, `src/lib/db/schema/orders.ts`, `src/lib/db/schema/stock-movements.ts`
- Modify: `src/lib/db/schema/index.ts`

- [ ] **Step 1: Carts**

`src/lib/db/schema/carts.ts`:

```ts
import { bigint, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { products } from "./products"
import { users } from "./users"

export const carts = pgTable("carts", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
	sessionToken: text("session_token").unique(),
	currencyCode: text("currency_code").notNull().default("COP"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	expiresAt: timestamp("expires_at", { withTimezone: true }),
})

export const cartItems = pgTable("cart_items", {
	id: uuid("id").primaryKey().defaultRandom(),
	cartId: uuid("cart_id")
		.notNull()
		.references(() => carts.id, { onDelete: "cascade" }),
	productId: uuid("product_id")
		.notNull()
		.references(() => products.id, { onDelete: "restrict" }),
	quantity: integer("quantity").notNull(),
	unitPriceSnapshot: bigint("unit_price_snapshot", { mode: "number" }).notNull(),
	currencyCode: text("currency_code").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
```

- [ ] **Step 2: Orders**

`src/lib/db/schema/orders.ts`:

```ts
import {
	bigint,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core"
import { addresses } from "./addresses"
import { products } from "./products"
import { users } from "./users"

export const orderStatus = pgEnum("order_status", [
	"pending_payment",
	"paid",
	"preparing",
	"shipped",
	"delivered",
	"cancelled",
	"failed",
])

export const paymentMethod = pgEnum("payment_method", [
	"wompi_card",
	"wompi_pse",
	"wompi_nequi",
	"wompi_bancolombia",
	"wompi_daviplata",
	"mp",
	"paypal",
	"contraentrega",
])

export const paymentStatus = pgEnum("payment_status", [
	"pending",
	"authorized",
	"paid",
	"pending_on_delivery",
	"failed",
])

export const shippingCourier = pgEnum("shipping_courier", ["inter", "servientrega", "envia"])

export const orders = pgTable("orders", {
	id: uuid("id").primaryKey().defaultRandom(),
	orderNumber: text("order_number").notNull().unique(), // "VLJ-0001"
	userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
	guestEmail: text("guest_email"),
	guestPhone: text("guest_phone"),
	status: orderStatus("status").notNull().default("pending_payment"),
	currencyCode: text("currency_code").notNull().default("COP"),
	subtotalAmount: bigint("subtotal_amount", { mode: "number" }).notNull(),
	shippingAmount: bigint("shipping_amount", { mode: "number" }).notNull(),
	taxAmount: bigint("tax_amount", { mode: "number" }).notNull(),
	discountAmount: bigint("discount_amount", { mode: "number" }).notNull().default(0),
	totalAmount: bigint("total_amount", { mode: "number" }).notNull(),
	paymentMethod: paymentMethod("payment_method"),
	paymentStatus: paymentStatus("payment_status").notNull().default("pending"),
	shippingAddressId: uuid("shipping_address_id").references(() => addresses.id),
	billingAddressId: uuid("billing_address_id").references(() => addresses.id),
	shippingCourier: shippingCourier("shipping_courier"),
	shippingZoneId: uuid("shipping_zone_id"),
	trackingNumber: text("tracking_number"),
	notes: text("notes"),
	placedAt: timestamp("placed_at", { withTimezone: true }).notNull().defaultNow(),
	paidAt: timestamp("paid_at", { withTimezone: true }),
	shippedAt: timestamp("shipped_at", { withTimezone: true }),
	deliveredAt: timestamp("delivered_at", { withTimezone: true }),
	cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
	dianInvoiceId: text("dian_invoice_id"),
	dianStatus: text("dian_status"),
	dianProvider: text("dian_provider"),
	dianPayload: jsonb("dian_payload"),
	taxBreakdown: jsonb("tax_breakdown"),
})

export const orderItems = pgTable("order_items", {
	id: uuid("id").primaryKey().defaultRandom(),
	orderId: uuid("order_id")
		.notNull()
		.references(() => orders.id, { onDelete: "cascade" }),
	productId: uuid("product_id")
		.notNull()
		.references(() => products.id, { onDelete: "restrict" }),
	nameSnapshot: text("name_snapshot").notNull(),
	imageSnapshotUrl: text("image_snapshot_url"),
	quantity: integer("quantity").notNull(),
	unitPriceAmount: bigint("unit_price_amount", { mode: "number" }).notNull(),
	currencyCode: text("currency_code").notNull(),
	lineTotalAmount: bigint("line_total_amount", { mode: "number" }).notNull(),
	dianTaxRateSnapshot: integer("dian_tax_rate_snapshot").notNull(),
})

export type Order = typeof orders.$inferSelect
export type OrderItem = typeof orderItems.$inferSelect
```

- [ ] **Step 3: Stock movements**

`src/lib/db/schema/stock-movements.ts`:

```ts
import { integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { orders } from "./orders"
import { products } from "./products"
import { users } from "./users"

export const stockMovementReason = pgEnum("stock_movement_reason", [
	"sale",
	"cancellation",
	"restock",
	"adjustment",
	"return",
])

export const stockMovements = pgTable("stock_movements", {
	id: uuid("id").primaryKey().defaultRandom(),
	productId: uuid("product_id")
		.notNull()
		.references(() => products.id, { onDelete: "restrict" }),
	delta: integer("delta").notNull(),
	reason: stockMovementReason("reason").notNull(),
	orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
	staffId: uuid("staff_id").references(() => users.id, { onDelete: "set null" }),
	notes: text("notes"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
```

- [ ] **Step 4: Update barrel**

```ts
// src/lib/db/schema/index.ts — add these lines
export * from "./carts"
export * from "./orders"
export * from "./stock-movements"
```

- [ ] **Step 5: Typecheck + commit**

```bash
pnpm typecheck
git add -A
git commit -m "feat(db): cart, order, stock movement schemas"
```

---

### Task 6: Schema — shipping, payments, wishlist, back-in-stock

**Files:**
- Create: `src/lib/db/schema/shipping-zones.ts`, `src/lib/db/schema/payments.ts`, `src/lib/db/schema/wishlist.ts`, `src/lib/db/schema/back-in-stock.ts`
- Modify: `src/lib/db/schema/index.ts`

- [ ] **Step 1: Shipping zones**

`src/lib/db/schema/shipping-zones.ts`:

```ts
import {
	bigint,
	boolean,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core"

export const shippingZones = pgTable("shipping_zones", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	country: text("country").notNull().default("CO"),
	department: text("department").notNull(),
	cities: jsonb("cities").$type<string[] | null>(),
	baseRateAmount: bigint("base_rate_amount", { mode: "number" }).notNull(),
	currencyCode: text("currency_code").notNull().default("COP"),
	courierDefault: text("courier_default"),
	allowsCod: boolean("allows_cod").notNull().default(false),
	isActive: boolean("is_active").notNull().default(true),
	sortOrder: integer("sort_order").notNull().default(0),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export type ShippingZone = typeof shippingZones.$inferSelect
```

- [ ] **Step 2: Payments + webhook events**

`src/lib/db/schema/payments.ts`:

```ts
import { bigint, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core"
import { orders } from "./orders"

export const payments = pgTable("payments", {
	id: uuid("id").primaryKey().defaultRandom(),
	orderId: uuid("order_id")
		.notNull()
		.references(() => orders.id, { onDelete: "cascade" }),
	provider: text("provider").notNull(),
	providerRef: text("provider_ref").notNull(),
	status: text("status").notNull(),
	amountAmount: bigint("amount_amount", { mode: "number" }).notNull(),
	currencyCode: text("currency_code").notNull(),
	rawPayload: jsonb("raw_payload"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const webhookEvents = pgTable(
	"webhook_events",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		provider: text("provider").notNull(),
		eventId: text("event_id").notNull(),
		type: text("type").notNull(),
		payload: jsonb("payload"),
		receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
		processedAt: timestamp("processed_at", { withTimezone: true }),
		status: text("status").notNull().default("received"),
	},
	(t) => ({
		providerEventIdx: uniqueIndex("webhook_provider_event_idx").on(t.provider, t.eventId),
	}),
)
```

- [ ] **Step 3: Wishlist**

`src/lib/db/schema/wishlist.ts`:

```ts
import { pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core"
import { products } from "./products"
import { users } from "./users"

export const wishlistItems = pgTable(
	"wishlist_items",
	{
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		productId: uuid("product_id")
			.notNull()
			.references(() => products.id, { onDelete: "cascade" }),
		addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.userId, t.productId] }),
	}),
)
```

- [ ] **Step 4: Back-in-stock**

`src/lib/db/schema/back-in-stock.ts`:

```ts
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { products } from "./products"
import { users } from "./users"

export const backInStockSubscriptions = pgTable("back_in_stock_subscriptions", {
	id: uuid("id").primaryKey().defaultRandom(),
	productId: uuid("product_id")
		.notNull()
		.references(() => products.id, { onDelete: "cascade" }),
	email: text("email").notNull(),
	userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
	notifiedAt: timestamp("notified_at", { withTimezone: true }),
	unsubscribeToken: text("unsubscribe_token").notNull().unique(),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
```

- [ ] **Step 5: Update barrel**

```ts
// src/lib/db/schema/index.ts — add these lines
export * from "./shipping-zones"
export * from "./payments"
export * from "./wishlist"
export * from "./back-in-stock"
```

- [ ] **Step 6: Typecheck + commit**

```bash
pnpm typecheck
git add -A
git commit -m "feat(db): shipping, payments, wishlist, back-in-stock schemas"
```

---

### Task 7: Schema — pages, settings, fx_rates

**Files:**
- Create: `src/lib/db/schema/pages.ts`, `src/lib/db/schema/settings.ts`, `src/lib/db/schema/fx-rates.ts`
- Modify: `src/lib/db/schema/index.ts`

- [ ] **Step 1: Pages**

`src/lib/db/schema/pages.ts`:

```ts
import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const pages = pgTable("pages", {
	id: uuid("id").primaryKey().defaultRandom(),
	slug: text("slug").notNull().unique(),
	title: text("title").notNull(),
	body: jsonb("body"),
	metaDescription: text("meta_description"),
	ogImageUrl: text("og_image_url"),
	publishedAt: timestamp("published_at", { withTimezone: true }),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})
```

- [ ] **Step 2: Settings**

`src/lib/db/schema/settings.ts`:

```ts
import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const settings = pgTable("settings", {
	key: text("key").primaryKey(),
	value: jsonb("value").notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})
```

- [ ] **Step 3: FX rates**

`src/lib/db/schema/fx-rates.ts`:

```ts
import { numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const fxRates = pgTable("fx_rates", {
	id: uuid("id").primaryKey().defaultRandom(),
	baseCurrency: text("base_currency").notNull(),
	quoteCurrency: text("quote_currency").notNull(),
	rate: numeric("rate", { precision: 18, scale: 8 }).notNull(),
	effectiveAt: timestamp("effective_at", { withTimezone: true }).notNull(),
	source: text("source").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
```

- [ ] **Step 4: Update barrel**

```ts
// src/lib/db/schema/index.ts — final form
export * from "./users"
export * from "./auth"
export * from "./addresses"
export * from "./products"
export * from "./product-images"
export * from "./attributes"
export * from "./carts"
export * from "./orders"
export * from "./stock-movements"
export * from "./shipping-zones"
export * from "./payments"
export * from "./wishlist"
export * from "./back-in-stock"
export * from "./pages"
export * from "./settings"
export * from "./fx-rates"
```

- [ ] **Step 5: Typecheck + commit**

```bash
pnpm typecheck
git add -A
git commit -m "feat(db): pages, settings, fx-rates schemas"
```

---

### Task 8: Generate and run initial migration

**Files:**
- Create: `drizzle/0000_*.sql` (auto-generated)

- [ ] **Step 1: Ensure a database is reachable**

You need a Postgres database that `DATABASE_URL` points at. Options:
- **Neon dev branch** — create at https://neon.tech, copy connection string into `.env.development`.
- **Local Postgres** — `docker run --name velajuy-pg -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=velajuy -p 5432:5432 -d postgres:16` then `DATABASE_URL=postgres://postgres:dev@localhost:5432/velajuy`.

Verify reachable:

```bash
pnpm tsx -e "import postgres from 'postgres'; const c = postgres(process.env.DATABASE_URL!); await c\`select 1\`; console.log('ok'); await c.end()"
```

Expected: `ok`. (Loads from `.env.development` if you prefix with `node --env-file=.env.development`.)

- [ ] **Step 2: Generate initial migration**

```bash
pnpm db:generate
```

Expected: drizzle-kit prints a summary of every table to be created and writes `drizzle/0000_<random>.sql`.

- [ ] **Step 3: Apply migration**

```bash
pnpm db:migrate
```

Expected: log lines for each table created, exit 0.

- [ ] **Step 4: Verify in psql / Studio**

```bash
pnpm db:studio
```

Open the URL it prints and confirm tables exist: `users`, `sessions`, `accounts`, `verifications`, `addresses`, `products`, `product_images`, `attributes`, `attribute_values`, `product_attribute_values`, `carts`, `cart_items`, `orders`, `order_items`, `stock_movements`, `shipping_zones`, `payments`, `webhook_events`, `wishlist_items`, `back_in_stock_subscriptions`, `pages`, `settings`, `fx_rates`.

- [ ] **Step 5: Commit migration file**

```bash
git add drizzle/
git commit -m "feat(db): initial migration"
```

---

### Task 9: better-auth setup (server + client + handler)

**Files:**
- Create: `src/lib/auth.ts`, `src/lib/auth-client.ts`, `src/app/api/auth/[...all]/route.ts`

- [ ] **Step 1: better-auth server config**

`src/lib/auth.ts`:

```ts
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { magicLink } from "better-auth/plugins"
import { db } from "@/lib/db"
import { env } from "@/lib/env"

export const auth = betterAuth({
	database: drizzleAdapter(db, { provider: "pg" }),
	baseURL: env.BETTER_AUTH_URL,
	secret: env.BETTER_AUTH_SECRET,
	user: {
		additionalFields: {
			role: { type: "string", defaultValue: "customer", input: false },
			phone: { type: "string", required: false },
		},
	},
	plugins: [
		magicLink({
			sendMagicLink: async ({ email, url }) => {
				// Phase 1: log to console. Resend integration arrives in Plan 5.
				console.log(`[magic-link] ${email} → ${url}`)
			},
		}),
	],
})

export type Session = typeof auth.$Infer.Session
```

- [ ] **Step 2: better-auth client**

`src/lib/auth-client.ts`:

```ts
import { createAuthClient } from "better-auth/react"
import { magicLinkClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_APP_URL!,
	plugins: [magicLinkClient()],
})

export const { signIn, signOut, useSession } = authClient
```

- [ ] **Step 3: Auth handler route**

`src/app/api/auth/[...all]/route.ts`:

```ts
import { toNextJsHandler } from "better-auth/next-js"
import { auth } from "@/lib/auth"

export const { GET, POST } = toNextJsHandler(auth)
```

- [ ] **Step 4: Verify it boots**

```bash
pnpm dev
```

Hit `http://localhost:3000/api/auth/ok` — expect a 200 JSON response from better-auth. Ctrl-C to stop.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(auth): better-auth with magic-link"
```

---

### Task 10: Money + locale utility

**Files:**
- Create: `src/lib/money.ts`, `tests/unit/money.test.ts`

- [ ] **Step 1: Failing tests**

`tests/unit/money.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { formatCOP, fromMinor, toMinor } from "@/lib/money"

describe("money", () => {
	it("toMinor converts pesos to minor units", () => {
		expect(toMinor(50_000)).toBe(5_000_000)
		expect(toMinor(0)).toBe(0)
	})

	it("fromMinor converts minor units back to pesos", () => {
		expect(fromMinor(5_000_000)).toBe(50_000)
	})

	it("formatCOP renders Colombian peso", () => {
		expect(formatCOP(5_000_000)).toBe("$ 50.000")
		expect(formatCOP(0)).toBe("$ 0")
	})

	it("toMinor refuses non-integer pesos", () => {
		expect(() => toMinor(50_000.5)).toThrow()
	})
})
```

- [ ] **Step 2: Run — fails**

```bash
pnpm test -- money.test
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`src/lib/money.ts`:

```ts
const COP = new Intl.NumberFormat("es-CO", {
	style: "currency",
	currency: "COP",
	maximumFractionDigits: 0,
})

export function toMinor(pesos: number): number {
	if (!Number.isInteger(pesos)) {
		throw new Error(`toMinor expects integer pesos, got ${pesos}`)
	}
	return pesos * 100
}

export function fromMinor(minor: number): number {
	return Math.round(minor / 100)
}

export function formatCOP(minor: number): string {
	return COP.format(fromMinor(minor))
}
```

- [ ] **Step 4: Run — passes**

```bash
pnpm test -- money.test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: money utility for COP"
```

---

### Task 11: Storefront chrome (header + footer + layout)

**Files:**
- Create: `src/app/(storefront)/layout.tsx`, `src/app/(storefront)/catalogo/page.tsx`, `src/components/storefront/header.tsx`, `src/components/storefront/footer.tsx`
- Modify: `src/app/page.tsx` (move under storefront group later — for now keep it at root since route group includes root)

- [ ] **Step 1: Header**

`src/components/storefront/header.tsx`:

```tsx
import Link from "next/link"

export function StorefrontHeader() {
	return (
		<header className="border-b border-velajuy-wine/10 bg-velajuy-cream">
			<nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
				<Link href="/" className="text-2xl font-bold text-velajuy-wine">
					Velajuy
				</Link>
				<ul className="flex items-center gap-6 text-sm text-velajuy-wine">
					<li>
						<Link href="/catalogo">Catálogo</Link>
					</li>
					<li>
						<Link href="/cuidado">Cuidado</Link>
					</li>
					<li>
						<Link href="/sobre">Sobre</Link>
					</li>
					<li>
						<Link href="/cuenta">Cuenta</Link>
					</li>
				</ul>
			</nav>
		</header>
	)
}
```

- [ ] **Step 2: Footer**

`src/components/storefront/footer.tsx`:

```tsx
export function StorefrontFooter() {
	return (
		<footer className="mt-24 border-t border-velajuy-wine/10 bg-velajuy-cream">
			<div className="mx-auto max-w-6xl px-6 py-10 text-sm text-velajuy-wine-soft">
				<p>© {new Date().getFullYear()} Velajuy Pelucas · Hecho con ♥ en Bucaramanga</p>
			</div>
		</footer>
	)
}
```

- [ ] **Step 3: Storefront layout**

`src/app/(storefront)/layout.tsx`:

```tsx
import { StorefrontFooter } from "@/components/storefront/footer"
import { StorefrontHeader } from "@/components/storefront/header"

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-h-screen flex-col">
			<StorefrontHeader />
			<div className="flex-1">{children}</div>
			<StorefrontFooter />
		</div>
	)
}
```

- [ ] **Step 4: Move home page under the group**

Delete `src/app/page.tsx`. Create `src/app/(storefront)/page.tsx`:

```tsx
export default function HomePage() {
	return (
		<main className="mx-auto max-w-3xl px-6 py-24">
			<h1 className="text-4xl font-bold text-velajuy-wine">Velajuy Pelucas</h1>
			<p className="mt-4 text-velajuy-wine-soft">Próximamente.</p>
		</main>
	)
}
```

- [ ] **Step 5: PLP placeholder**

`src/app/(storefront)/catalogo/page.tsx`:

```tsx
export default function CatalogoPage() {
	return (
		<main className="mx-auto max-w-6xl px-6 py-16">
			<h1 className="text-3xl font-bold text-velajuy-wine">Catálogo</h1>
			<p className="mt-4 text-velajuy-wine-soft">Próximamente.</p>
		</main>
	)
}
```

- [ ] **Step 6: Verify**

```bash
pnpm dev
```

Visit `/` and `/catalogo`. Header + footer appear. Ctrl-C.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(storefront): base chrome and placeholder pages"
```

---

### Task 12: Customer login page (magic-link)

**Files:**
- Create: `src/app/ingresar/page.tsx`, `src/app/cuenta/page.tsx`

- [ ] **Step 1: Login page**

`src/app/ingresar/page.tsx`:

```tsx
"use client"

import { useState } from "react"
import { signIn } from "@/lib/auth-client"

export default function IngresarPage() {
	const [email, setEmail] = useState("")
	const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle")
	const [error, setError] = useState<string | null>(null)

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setStatus("loading")
		setError(null)
		const result = await signIn.magicLink({ email, callbackURL: "/cuenta" })
		if (result.error) {
			setStatus("error")
			setError(result.error.message ?? "Error al enviar el enlace")
			return
		}
		setStatus("sent")
	}

	return (
		<main className="mx-auto max-w-md px-6 py-24">
			<h1 className="text-3xl font-bold text-velajuy-wine">Ingresar</h1>
			<p className="mt-2 text-velajuy-wine-soft">Te enviamos un enlace mágico a tu correo.</p>

			{status === "sent" ? (
				<p className="mt-6 rounded-xl bg-velajuy-pink-soft p-4 text-velajuy-wine">
					¡Listo! Revisa tu correo y haz clic en el enlace para entrar.
				</p>
			) : (
				<form className="mt-6 space-y-4" onSubmit={handleSubmit}>
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						placeholder="tu@correo.com"
						className="w-full rounded-xl border border-velajuy-wine/20 bg-white px-4 py-3 text-velajuy-wine outline-none focus:border-velajuy-wine"
					/>
					<button
						type="submit"
						disabled={status === "loading"}
						className="w-full rounded-xl bg-velajuy-wine px-4 py-3 font-medium text-white disabled:opacity-60"
					>
						{status === "loading" ? "Enviando…" : "Enviar enlace"}
					</button>
					{error && <p className="text-sm text-red-700">{error}</p>}
				</form>
			)}
		</main>
	)
}
```

- [ ] **Step 2: Cuenta (gated placeholder)**

`src/app/cuenta/page.tsx`:

```tsx
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"

export default async function CuentaPage() {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session) redirect("/ingresar")

	return (
		<main className="mx-auto max-w-3xl px-6 py-24">
			<h1 className="text-3xl font-bold text-velajuy-wine">Hola, {session.user.name ?? session.user.email}</h1>
			<p className="mt-2 text-velajuy-wine-soft">Tu cuenta — próximamente.</p>
		</main>
	)
}
```

- [ ] **Step 3: Verify in dev**

```bash
pnpm dev
```

Visit `/cuenta` → redirects to `/ingresar`. Submit your email; check the dev console for the magic-link URL (logged by `sendMagicLink`). Open that URL → lands on `/cuenta`. Ctrl-C.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(auth): customer magic-link login and gated cuenta"
```

---

### Task 13: Admin chrome + role gate + admin login

**Files:**
- Create: `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`, `src/app/admin/ingresar/page.tsx`, `src/components/admin/shell.tsx`, `src/components/admin/sidebar.tsx`

- [ ] **Step 1: Sidebar**

`src/components/admin/sidebar.tsx`:

```tsx
import Link from "next/link"

const links = [
	{ href: "/admin", label: "Dashboard" },
	{ href: "/admin/pedidos", label: "Pedidos" },
	{ href: "/admin/productos", label: "Productos" },
	{ href: "/admin/inventario", label: "Inventario" },
	{ href: "/admin/zonas", label: "Zonas de envío" },
	{ href: "/admin/paginas", label: "Páginas" },
	{ href: "/admin/configuracion", label: "Configuración" },
]

export function AdminSidebar() {
	return (
		<aside className="w-60 shrink-0 border-r border-velajuy-wine/10 bg-velajuy-cream p-4">
			<Link href="/admin" className="block text-xl font-bold text-velajuy-wine">
				Velajuy · Admin
			</Link>
			<nav className="mt-6 space-y-1">
				{links.map((l) => (
					<Link
						key={l.href}
						href={l.href}
						className="block rounded-lg px-3 py-2 text-sm text-velajuy-wine hover:bg-velajuy-pink-soft"
					>
						{l.label}
					</Link>
				))}
			</nav>
		</aside>
	)
}
```

- [ ] **Step 2: Shell**

`src/components/admin/shell.tsx`:

```tsx
import { AdminSidebar } from "./sidebar"

export function AdminShell({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-h-screen bg-white">
			<AdminSidebar />
			<main className="flex-1 p-8">{children}</main>
		</div>
	)
}
```

- [ ] **Step 3: Admin layout with role gate**

`src/app/admin/layout.tsx`:

```tsx
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { AdminShell } from "@/components/admin/shell"
import { auth } from "@/lib/auth"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	const requestHeaders = await headers()
	const pathname = requestHeaders.get("x-pathname") ?? ""
	if (pathname.startsWith("/admin/ingresar")) {
		return <>{children}</>
	}

	const session = await auth.api.getSession({ headers: requestHeaders })
	if (!session) redirect("/admin/ingresar")

	const role = (session.user as { role?: string }).role
	if (role !== "staff" && role !== "owner") {
		redirect("/admin/ingresar?error=unauthorized")
	}

	return <AdminShell>{children}</AdminShell>
}
```

Note: Next.js doesn't expose `x-pathname` by default. Add a middleware to inject it.

`middleware.ts` at the project root (sets `x-pathname` on the **request** headers forwarded downstream — Server Components read request headers, not response headers):

```ts
import { NextResponse, type NextRequest } from "next/server"

export function middleware(req: NextRequest) {
	const requestHeaders = new Headers(req.headers)
	requestHeaders.set("x-pathname", req.nextUrl.pathname)
	return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
	matcher: ["/((?!_next|api|.*\\.).*)"],
}
```

- [ ] **Step 4: Admin login page**

`src/app/admin/ingresar/page.tsx`:

```tsx
"use client"

import { useState } from "react"
import { signIn } from "@/lib/auth-client"

export default function AdminIngresarPage() {
	const [email, setEmail] = useState("")
	const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle")

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setStatus("loading")
		await signIn.magicLink({ email, callbackURL: "/admin" })
		setStatus("sent")
	}

	return (
		<main className="mx-auto max-w-md px-6 py-24">
			<h1 className="text-3xl font-bold text-velajuy-wine">Ingresar al Admin</h1>
			{status === "sent" ? (
				<p className="mt-6 rounded-xl bg-velajuy-pink-soft p-4 text-velajuy-wine">
					Revisa tu correo y haz clic en el enlace.
				</p>
			) : (
				<form className="mt-6 space-y-4" onSubmit={handleSubmit}>
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						placeholder="tu@correo.com"
						className="w-full rounded-xl border border-velajuy-wine/20 bg-white px-4 py-3 text-velajuy-wine outline-none focus:border-velajuy-wine"
					/>
					<button
						type="submit"
						disabled={status === "loading"}
						className="w-full rounded-xl bg-velajuy-wine px-4 py-3 font-medium text-white disabled:opacity-60"
					>
						Enviar enlace
					</button>
				</form>
			)}
		</main>
	)
}
```

- [ ] **Step 5: Admin dashboard placeholder**

`src/app/admin/page.tsx`:

```tsx
export default function AdminDashboard() {
	return (
		<div>
			<h1 className="text-3xl font-bold text-velajuy-wine">Dashboard</h1>
			<p className="mt-2 text-velajuy-wine-soft">Próximamente.</p>
		</div>
	)
}
```

- [ ] **Step 6: Verify**

```bash
pnpm dev
```

Visit `/admin` while logged out → redirects to `/admin/ingresar`. Log in via console magic-link URL — without `role = 'staff' | 'owner'` you'll be sent back. (We'll fix this by creating an owner user in the seed task next.) Ctrl-C.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(admin): chrome, role-gated layout, login"
```

---

### Task 14: Seed script — owner user, settings, shipping zones

**Files:**
- Create: `src/lib/db/seed.ts`, `public/placeholder.png`

- [ ] **Step 1: Placeholder image**

Save a 600×600 transparent PNG (or a simple pink/burgundy mascot placeholder) at `public/placeholder.png`. Any neutral image works for Phase 1.

- [ ] **Step 2: Seed script**

`src/lib/db/seed.ts`:

```ts
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { settings, shippingZones, users } from "@/lib/db/schema"

const OWNER_EMAIL = process.env.SEED_OWNER_EMAIL ?? "andre.vital@metalab.com"

async function upsertOwner() {
	const existing = await db.select().from(users).where(eq(users.email, OWNER_EMAIL))
	if (existing.length === 0) {
		await db.insert(users).values({
			email: OWNER_EMAIL,
			name: "Owner",
			role: "owner",
			emailVerified: true,
		})
		console.log(`Created owner: ${OWNER_EMAIL}`)
	} else if (existing[0].role !== "owner") {
		await db.update(users).set({ role: "owner" }).where(eq(users.email, OWNER_EMAIL))
		console.log(`Promoted to owner: ${OWNER_EMAIL}`)
	} else {
		console.log(`Owner exists: ${OWNER_EMAIL}`)
	}
}

const SETTING_DEFAULTS: Record<string, unknown> = {
	shop_name: "Velajuy Pelucas",
	contact_email: "hola@velajuy.com",
	contact_phone: "+57 310 555 8001",
	social_instagram: "@velajuy_pelucas",
	free_shipping_min_quantity: 3,
	low_stock_threshold_default: 2,
	iva_default_rate: 19,
	notifications: {
		new_order: { enabled: true, frequency: "immediate", email: null },
		payment_received: { enabled: true, frequency: "immediate", email: null },
		stock_low: { enabled: true, frequency: "immediate", email: null },
		cod_ready: { enabled: true, frequency: "immediate", email: null },
	},
}

async function upsertSettings() {
	for (const [key, value] of Object.entries(SETTING_DEFAULTS)) {
		const existing = await db.select().from(settings).where(eq(settings.key, key))
		if (existing.length === 0) {
			await db.insert(settings).values({ key, value })
			console.log(`Created setting: ${key}`)
		}
	}
}

const ZONE_DEFAULTS = [
	{
		name: "Bucaramanga",
		country: "CO",
		department: "Santander",
		cities: ["Bucaramanga"],
		baseRateAmount: 1_000_000, // $10.000 COP
		currencyCode: "COP",
		courierDefault: "inter",
		allowsCod: true,
		sortOrder: 10,
	},
	{
		name: "Área Metropolitana de Bucaramanga",
		country: "CO",
		department: "Santander",
		cities: ["Floridablanca", "Piedecuesta", "Girón"],
		baseRateAmount: 1_200_000, // owner-adjustable
		currencyCode: "COP",
		courierDefault: "inter",
		allowsCod: true,
		sortOrder: 20,
	},
	{
		name: "Resto del país",
		country: "CO",
		department: "*",
		cities: null,
		baseRateAmount: 2_500_000, // $25.000 placeholder
		currencyCode: "COP",
		courierDefault: "servientrega",
		allowsCod: false,
		sortOrder: 1000,
	},
]

async function upsertZones() {
	for (const zone of ZONE_DEFAULTS) {
		const existing = await db.select().from(shippingZones).where(eq(shippingZones.name, zone.name))
		if (existing.length === 0) {
			await db.insert(shippingZones).values(zone)
			console.log(`Created zone: ${zone.name}`)
		}
	}
}

async function main() {
	await upsertOwner()
	await upsertSettings()
	await upsertZones()
	console.log("Seed complete.")
	process.exit(0)
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})
```

- [ ] **Step 3: Run seed**

```bash
pnpm db:seed
```

Expected output:

```
Created owner: andre.vital@metalab.com
Created setting: shop_name
... (one line per setting)
Created zone: Bucaramanga
Created zone: Área Metropolitana de Bucaramanga
Created zone: Resto del país
Seed complete.
```

- [ ] **Step 4: Verify in Studio**

```bash
pnpm db:studio
```

Inspect `users` (one owner row), `settings` (8 rows), `shipping_zones` (3 rows).

- [ ] **Step 5: Rerun is idempotent**

```bash
pnpm db:seed
```

Expected: `Owner exists: …`, no duplicate settings/zones inserted.

- [ ] **Step 6: Log in as owner end-to-end**

```bash
pnpm dev
```

1. Visit `/admin/ingresar`.
2. Submit `andre.vital@metalab.com`.
3. Copy the magic-link URL from the dev console, open in a new browser tab.
4. You should land on `/admin` and see the Dashboard placeholder with sidebar.

Ctrl-C.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(db): idempotent seed for owner, settings, zones"
```

---

### Task 15: Playwright smoke tests

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/homepage.spec.ts`, `tests/e2e/admin-gate.spec.ts`, `tests/e2e/customer-login.spec.ts`

- [ ] **Step 1: Playwright config**

`playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
	testDir: "./tests/e2e",
	fullyParallel: false,
	retries: 0,
	use: {
		baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
		trace: "on-first-retry",
	},
	projects: [{ name: "chromium", use: devices["Desktop Chrome"] }],
	webServer: {
		command: "pnpm dev",
		url: "http://localhost:3000",
		reuseExistingServer: true,
		timeout: 60_000,
	},
})
```

- [ ] **Step 2: Install Playwright browsers**

```bash
pnpm exec playwright install chromium
```

- [ ] **Step 3: Homepage smoke**

`tests/e2e/homepage.spec.ts`:

```ts
import { expect, test } from "@playwright/test"

test("home renders brand mark", async ({ page }) => {
	await page.goto("/")
	await expect(page.getByRole("heading", { name: /Velajuy Pelucas/i })).toBeVisible()
})

test("storefront header links work", async ({ page }) => {
	await page.goto("/")
	await page.getByRole("link", { name: "Catálogo" }).click()
	await expect(page).toHaveURL(/\/catalogo$/)
})
```

- [ ] **Step 4: Admin gate smoke**

`tests/e2e/admin-gate.spec.ts`:

```ts
import { expect, test } from "@playwright/test"

test("unauth visit to /admin redirects to /admin/ingresar", async ({ page }) => {
	await page.goto("/admin")
	await expect(page).toHaveURL(/\/admin\/ingresar/)
	await expect(page.getByRole("heading", { name: /Ingresar al Admin/i })).toBeVisible()
})
```

- [ ] **Step 5: Customer login smoke**

`tests/e2e/customer-login.spec.ts`:

```ts
import { expect, test } from "@playwright/test"

test("customer login form posts and shows confirmation", async ({ page }) => {
	await page.goto("/ingresar")
	await page.getByPlaceholder("tu@correo.com").fill("test@example.com")
	await page.getByRole("button", { name: /Enviar enlace/i }).click()
	await expect(page.getByText(/Revisa tu correo/i)).toBeVisible({ timeout: 10_000 })
})
```

- [ ] **Step 6: Run all E2E**

```bash
pnpm test:e2e
```

Expected: 4 tests pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "test: playwright smoke for home, admin gate, customer login"
```

---

### Task 16: CI workflow + final verification

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: GitHub Actions CI**

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: ci
          POSTGRES_DB: velajuy
        ports: ["5432:5432"]
        options: >-
          --health-cmd "pg_isready -U postgres"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    env:
      DATABASE_URL: postgres://postgres:ci@localhost:5432/velajuy
      BETTER_AUTH_SECRET: ci-secret-must-be-at-least-32-characters-long
      BETTER_AUTH_URL: http://localhost:3000
      NEXT_PUBLIC_APP_URL: http://localhost:3000
      NODE_ENV: test
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm format:check
      - run: pnpm db:migrate
      - run: pnpm test
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:e2e
```

- [ ] **Step 2: Run the full local pipeline**

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm test:e2e
```

Expected: all pass. If `format:check` fails, run `pnpm format` and recommit.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "ci: github actions for typecheck, lint, format, test, e2e"
```

- [ ] **Step 4: Final foundation verification checklist**

Read each item, run the command if applicable, confirm it works:

- `pnpm dev` boots cleanly on http://localhost:3000.
- `/` shows "Velajuy Pelucas — Próximamente." with header/footer.
- `/catalogo` renders the placeholder PLP.
- `/admin` redirects to `/admin/ingresar` when not logged in.
- Logging in as the seeded owner email lands on `/admin` Dashboard.
- `pnpm db:studio` lists all 23 tables from the file structure.
- `pnpm db:seed` is idempotent (rerunning produces "exists" lines only).
- `pnpm test` shows passing unit tests (env + money).
- `pnpm test:e2e` shows 4 passing Playwright specs.
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check` all clean.

If any item fails, fix before declaring Foundation complete.

- [ ] **Step 5: Tag**

```bash
git tag phase-1-foundation
git log --oneline -20
```

Foundation done. Plan 2 (Catalog & Discovery) is next.

---

## Notes for the implementing engineer

- **Tab indentation, no semicolons, double quotes** — enforced by Prettier. Do not fight the config.
- **Money is always integer minor units + currency code.** Never floats. `formatCOP` is the only display path.
- **Locale is `es-CO`.** All copy uses "tú" form. Dates via `Intl.DateTimeFormat('es-CO')`.
- **Schema files are one entity-group per file.** Plans 2-5 add fields by editing the relevant file; do not consolidate.
- **`magicLink` plugin currently logs to console** — Plan 5 swaps this for Resend. Until then, dev login is "check the terminal where `pnpm dev` is running."
- **Brand colors live in `globals.css` `@theme`.** Use Tailwind classes like `bg-velajuy-pink-soft`, `text-velajuy-wine`. Never hard-code hex elsewhere.
- **Commit after every task** (each `git commit` step). Keeps blast radius small and review easy.
- **If `db:migrate` fails on a fresh DB**, ensure `DATABASE_URL` points at a database that exists and is reachable; check `pg_isready`.
