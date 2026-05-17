# Velajuy Catalog & Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public catalog and discovery surface for Velajuy Pelucas — PLP with filters/sort, PDP with image gallery + tabs + related products, vista rápida modal, wishlist (logged-in), and back-in-stock subscriptions — sitting on top of the Phase 1 Foundation. Also absorbs three follow-ups from the Plan 1 final review: extract `requireAdmin()`, add `pnpm build` to CI, and wire Resend to `sendMagicLink`.

**Architecture:** Server Components do all reads (Drizzle directly from the `db` client). Filters and sort live in URL search params so PLP state is shareable and SSR-friendly. Quick-view uses an intercepted `(.)producto/[slug]` route to render a modal over PLP while keeping the URL deep-linkable. Wishlist and back-in-stock writes happen via Next.js Server Actions, guarded by `requireSession()` (wishlist) or open to guests (back-in-stock). Resend swaps in for `magicLink.sendMagicLink`, with a console-log fallback when `RESEND_API_KEY` is unset (preserves dev ergonomics).

**Tech Stack:** Next.js 16 (App Router, Server Components, Server Actions, intercepted routes), Drizzle ORM, Tailwind CSS 4, Resend (`resend` npm package), React Hook Form + Zod (subscription forms), Sonner toasts, Lucide icons, Playwright + Vitest.

---

## File Structure (created/touched in this plan)

```
velajuy/
├── .env.example                                       [modify] add RESEND_API_KEY notes
├── .github/workflows/ci.yml                           [modify] add pnpm build step
├── package.json                                       [modify] add resend, react-hook-form, @hookform/resolvers, sonner, lucide-react
├── src/
│   ├── app/
│   │   ├── layout.tsx                                 [modify] mount <Toaster /> from sonner
│   │   ├── (storefront)/
│   │   │   ├── catalogo/
│   │   │   │   ├── page.tsx                           [rewrite] PLP (filters, sort, grid)
│   │   │   │   ├── filter-sidebar.tsx                 [create] client filter form
│   │   │   │   └── sort-select.tsx                    [create] client sort dropdown
│   │   │   ├── producto/[slug]/
│   │   │   │   ├── page.tsx                           [create] PDP route
│   │   │   │   ├── gallery.tsx                        [create] client image gallery
│   │   │   │   ├── product-info.tsx                   [create] price + attrs + buttons
│   │   │   │   ├── product-tabs.tsx                   [create] tab strip + content
│   │   │   │   ├── related-products.tsx               [create] grid of 4 related
│   │   │   │   ├── back-in-stock-form.tsx             [create] email subscribe (when out of stock)
│   │   │   │   └── wishlist-button.tsx                [create] heart toggle (client)
│   │   │   ├── @modal/
│   │   │   │   ├── default.tsx                        [create] null parallel slot fallback
│   │   │   │   └── (.)producto/[slug]/page.tsx        [create] intercepted quick-view route
│   │   │   ├── layout.tsx                             [modify] add `@modal` slot
│   │   │   └── quick-view-modal.tsx                   [create] client modal wrapper
│   │   ├── cuenta/
│   │   │   ├── page.tsx                               [modify] add nav links
│   │   │   └── wishlist/page.tsx                      [create] customer wishlist view
│   │   ├── desuscribir/
│   │   │   └── back-in-stock/page.tsx                 [create] one-click unsubscribe page
│   │   └── admin/layout.tsx                           [modify] use requireAdmin() helper
│   ├── components/
│   │   ├── storefront/
│   │   │   ├── product-card.tsx                       [create] reusable product card with quick-view + wishlist
│   │   │   ├── stock-badge.tsx                        [create] "Disponible" / "Agotado" pill
│   │   │   └── price.tsx                              [create] thin wrapper over formatCOP
│   │   └── ui/
│   │       ├── modal.tsx                              [create] generic modal primitive
│   │       └── empty-state.tsx                        [create]
│   ├── lib/
│   │   ├── auth-guards.ts                             [create] requireSession(), requireAdmin()
│   │   ├── email/
│   │   │   ├── client.ts                              [create] Resend client + sendEmail fallback wrapper
│   │   │   └── templates/
│   │   │       └── magic-link.ts                      [create] subject + html for magic-link email
│   │   ├── env.ts                                     [modify] optional RESEND_API_KEY + EMAIL_FROM
│   │   ├── auth.ts                                    [modify] sendMagicLink → email client
│   │   ├── slug.ts                                    [create] slugify helper for attribute slugs
│   │   ├── catalog/
│   │   │   ├── filters.ts                             [create] parse + serialize URL filter params
│   │   │   ├── queries.ts                             [create] listProducts(), getProductBySlug(), listRelated(), listAttributeFacets()
│   │   │   └── filters.test.ts                        [create] unit tests
│   │   ├── wishlist/
│   │   │   ├── actions.ts                             [create] server actions: addToWishlist, removeFromWishlist
│   │   │   └── queries.ts                             [create] listUserWishlist(), isInWishlist()
│   │   ├── back-in-stock/
│   │   │   ├── actions.ts                             [create] subscribe + unsubscribe server actions
│   │   │   ├── queries.ts                             [create] findByToken()
│   │   │   └── token.ts                               [create] random token helper
│   │   └── db/
│   │       ├── schema/back-in-stock.ts                [modify] add unique (product_id, email) constraint
│   │       └── seed.ts                                [modify] seed attributes + sample products + page rows
├── drizzle/
│   └── 0001_*.sql                                     [create, auto-generated] back-in-stock unique constraint
├── public/
│   └── samples/                                       [create] tiny placeholder PNGs for seeded products (or commit a single solid-color png referenced by all)
└── tests/
    ├── unit/
    │   ├── filters.test.ts                            [create] (same file referenced above)
    │   └── slug.test.ts                               [create]
    └── e2e/
        ├── catalog.spec.ts                            [create] PLP filter + sort + quick-view + PDP nav
        ├── pdp.spec.ts                                [create] PDP renders all sections
        ├── wishlist.spec.ts                           [create] login → add → list → remove
        └── back-in-stock.spec.ts                      [create] subscribe → unsubscribe flow
```

Schema files split by responsibility: each entity-group already has its own file from Plan 1; only `back-in-stock.ts` gains a uniqueness constraint.

Catalog queries live in their own module — they will be called by PLP, PDP, related-products, and (in later plans) admin product list, so reuse pays off.

---

## Tasks

### Task 1: Extract `requireAdmin()` and `requireSession()` helpers

**Files:**
- Create: `src/lib/auth-guards.ts`
- Modify: `src/app/admin/layout.tsx`, `src/app/cuenta/page.tsx`

The current `admin/layout.tsx` calls `auth.api.getSession()` and inlines the role check. New admin pages added in this plan and beyond need the same guard. Extract one helper so the rule lives in one place. `requireSession()` is the customer-side variant — `cuenta` already inlines a smaller version.

- [ ] **Step 1: Create the helpers module**

`src/lib/auth-guards.ts`:

```ts
import type { Route } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

type AdminRole = "staff" | "owner"

export type AuthenticatedSession = NonNullable<
	Awaited<ReturnType<typeof auth.api.getSession>>
>

/** Returns the session or redirects to `/ingresar` with the current path as `redirect`. */
export async function requireSession(returnTo?: string): Promise<AuthenticatedSession> {
	const requestHeaders = await headers()
	const session = await auth.api.getSession({ headers: requestHeaders })
	if (!session) {
		const target = returnTo ?? requestHeaders.get("x-pathname") ?? "/cuenta"
		redirect(`/ingresar?redirect=${encodeURIComponent(target)}` as Route)
	}
	return session
}

/** Returns the session if the user has admin role; otherwise redirects to `/admin/ingresar`. */
export async function requireAdmin(): Promise<AuthenticatedSession & { role: AdminRole }> {
	const requestHeaders = await headers()
	const session = await auth.api.getSession({ headers: requestHeaders })
	if (!session) redirect("/admin/ingresar" as Route)

	const role = (session.user as { role?: string }).role
	if (role !== "staff" && role !== "owner") {
		redirect("/admin/ingresar?error=unauthorized" as Route)
	}
	return { ...session, role: role as AdminRole }
}
```

- [ ] **Step 2: Update admin layout to use it**

`src/app/admin/layout.tsx`:

```tsx
import { headers } from "next/headers"
import { AdminShell } from "@/components/admin/shell"
import { requireAdmin } from "@/lib/auth-guards"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	const pathname = (await headers()).get("x-pathname") ?? ""

	if (pathname.startsWith("/admin/ingresar")) {
		return <>{children}</>
	}

	await requireAdmin()
	return <AdminShell>{children}</AdminShell>
}
```

- [ ] **Step 3: Update `cuenta` page to use `requireSession()`**

`src/app/cuenta/page.tsx`:

```tsx
import Link from "next/link"
import { requireSession } from "@/lib/auth-guards"

export default async function CuentaPage() {
	const session = await requireSession("/cuenta")
	return (
		<main className="mx-auto max-w-3xl px-6 py-24">
			<h1 className="text-3xl font-bold text-velajuy-wine">
				Hola, {session.user.name ?? session.user.email}
			</h1>
			<nav className="mt-6 flex gap-4 text-velajuy-wine underline">
				<Link href="/cuenta/wishlist">Mi lista de deseos</Link>
			</nav>
		</main>
	)
}
```

- [ ] **Step 4: Typecheck**

Run: `pnpm typecheck`
Expected: clean.

- [ ] **Step 5: Verify admin still gates correctly**

Run: `pnpm dev`
Visit `/admin` while logged out. Expected: redirects to `/admin/ingresar`. Ctrl-C.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(auth): extract requireAdmin and requireSession helpers"
```

---

### Task 2: Add `pnpm build` to CI

**Files:**
- Modify: `.github/workflows/ci.yml`

The current CI runs typecheck, lint, format, migrate, test, and E2E — but never compiles the Next.js production bundle. A build failure (e.g. typed-routes mismatch, server-only import in a client component, broken Tailwind reference) would slip past CI today. Add it.

- [ ] **Step 1: Insert `pnpm build` after `pnpm test`**

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
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm format:check
      - run: pnpm exec drizzle-kit migrate
      - run: pnpm exec tsx src/lib/db/seed.ts
      - run: pnpm test
      - run: pnpm build
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:e2e
```

- [ ] **Step 2: Locally verify the build passes**

Run: `pnpm build`
Expected: Next.js prints "✓ Compiled successfully" and a route summary; exit 0. If it fails, fix the underlying issue before continuing.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "ci: run pnpm build in pipeline"
```

---

### Task 3: Wire Resend to `sendMagicLink`

**Files:**
- Modify: `package.json` (add `resend`)
- Modify: `src/lib/env.ts` (optional `RESEND_API_KEY`, `EMAIL_FROM`)
- Modify: `.env.example` (clarify dev fallback)
- Create: `src/lib/email/client.ts`, `src/lib/email/templates/magic-link.ts`
- Modify: `src/lib/auth.ts` (use email client)

Goal: real email delivery in production, console fallback in dev (no API key required to develop). The fallback also keeps Playwright tests deterministic — they read the magic-link URL from `console.log`.

- [ ] **Step 1: Add `resend`**

Run:

```bash
cd /Users/andrevital/Documents/work_stuff/av/velajuy
pnpm add resend
```

Expected: package added, lockfile updated.

- [ ] **Step 2: Extend env schema**

`src/lib/env.ts`:

```ts
// Validates at module load. Tests must use vi.resetModules() to re-trigger.
import { z } from "zod"

const schema = z.object({
	DATABASE_URL: z.url(),
	BETTER_AUTH_SECRET: z.string().min(32),
	BETTER_AUTH_URL: z.url(),
	NEXT_PUBLIC_APP_URL: z.url(),
	NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
	RESEND_API_KEY: z.string().optional(),
	EMAIL_FROM: z.string().default("Velajuy <noreply@velajuy.com>"),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
	const issues = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n")
	throw new Error(`Invalid environment variables:\n${issues}`)
}

export const env = parsed.data
```

- [ ] **Step 3: Email client**

`src/lib/email/client.ts`:

```ts
import { Resend } from "resend"
import { env } from "@/lib/env"

type SendArgs = {
	to: string
	subject: string
	html: string
	text?: string
}

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

export async function sendEmail({ to, subject, html, text }: SendArgs): Promise<void> {
	if (!resend) {
		console.log(`[email/dev] → ${to} · ${subject}\n${text ?? html}`)
		return
	}
	const { error } = await resend.emails.send({
		from: env.EMAIL_FROM,
		to,
		subject,
		html,
		text,
	})
	if (error) {
		throw new Error(`Resend send failed: ${error.message}`)
	}
}
```

- [ ] **Step 4: Magic-link template**

`src/lib/email/templates/magic-link.ts`:

```ts
export function magicLinkEmail({ url, email }: { url: string; email: string }) {
	const subject = "Tu enlace para entrar a Velajuy"
	const text = `Hola ${email},\n\nUsa este enlace para entrar a Velajuy:\n${url}\n\nEl enlace expira pronto. Si no fuiste tú, ignora este correo.\n\n— Velajuy`
	const html = `
		<div style="font-family: -apple-system, system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #5c1a2a;">
			<h1 style="margin: 0 0 16px; font-size: 24px;">Hola 👋</h1>
			<p style="margin: 0 0 24px; line-height: 1.5;">Haz clic en el botón para entrar a tu cuenta de Velajuy.</p>
			<p style="margin: 0 0 32px;">
				<a href="${url}" style="display: inline-block; background: #5c1a2a; color: #fff; padding: 14px 24px; border-radius: 12px; text-decoration: none; font-weight: 600;">Entrar a Velajuy</a>
			</p>
			<p style="margin: 0 0 8px; color: #7a3d4d; font-size: 14px;">O copia este enlace en tu navegador:</p>
			<p style="margin: 0; word-break: break-all; color: #7a3d4d; font-size: 13px;">${url}</p>
			<hr style="margin: 32px 0; border: none; border-top: 1px solid #f4b6c2;" />
			<p style="margin: 0; color: #7a3d4d; font-size: 12px;">Si no fuiste tú, ignora este correo. El enlace expira pronto.</p>
		</div>
	`
	return { subject, text, html }
}
```

- [ ] **Step 5: Wire into auth.ts**

`src/lib/auth.ts`:

```ts
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { magicLink } from "better-auth/plugins"
import { db } from "@/lib/db"
import { sendEmail } from "@/lib/email/client"
import { magicLinkEmail } from "@/lib/email/templates/magic-link"
import { env } from "@/lib/env"
import { users, sessions, accounts, verifications } from "@/lib/db/schema"

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		usePlural: true,
		schema: {
			users,
			sessions,
			accounts,
			verifications,
		},
	}),
	baseURL: env.BETTER_AUTH_URL,
	secret: env.BETTER_AUTH_SECRET,
	advanced: {
		database: { generateId: "uuid" },
	},
	user: {
		additionalFields: {
			role: { type: "string", defaultValue: "customer", input: false },
			phone: { type: "string", required: false },
		},
	},
	plugins: [
		magicLink({
			sendMagicLink: async ({ email, url }) => {
				const { subject, html, text } = magicLinkEmail({ email, url })
				await sendEmail({ to: email, subject, html, text })
			},
		}),
	],
})

export type Session = typeof auth.$Infer.Session
```

- [ ] **Step 6: Update `.env.example` comments**

`.env.example`:

```
# Database
DATABASE_URL=postgres://user:password@localhost:5432/velajuy

# Auth
BETTER_AUTH_SECRET=replace-me-with-openssl-rand-base64-32
BETTER_AUTH_URL=http://localhost:3000

# Email — leave RESEND_API_KEY blank in dev to fall back to console.log
RESEND_API_KEY=
EMAIL_FROM=Velajuy <noreply@velajuy.com>

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

- [ ] **Step 7: Verify dev fallback still works**

Run: `pnpm dev`
Visit `/ingresar`, submit your email. Expected: dev terminal logs `[email/dev] → … · Tu enlace para entrar a Velajuy` followed by the full text including the magic-link URL. Ctrl-C.

- [ ] **Step 8: Typecheck + commit**

```bash
pnpm typecheck
git add -A
git commit -m "feat(auth): send magic-link via resend with console fallback"
```

---

### Task 4: Slug helper + back-in-stock unique constraint migration

**Files:**
- Create: `src/lib/slug.ts`, `tests/unit/slug.test.ts`
- Modify: `src/lib/db/schema/back-in-stock.ts`
- Create (auto): `drizzle/0001_*.sql`

The seed in Task 5 generates attribute_value slugs from names; PLP filter URLs use the same slugs. One slugifier, one rule. Back-in-stock must reject duplicate (product, email) subscriptions — current schema allows it. Add a unique constraint.

- [ ] **Step 1: Failing slug tests**

`tests/unit/slug.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { slugify } from "@/lib/slug"

describe("slugify", () => {
	it("lowercases", () => {
		expect(slugify("Rosa")).toBe("rosa")
	})

	it("strips accents", () => {
		expect(slugify("Café Rosé")).toBe("cafe-rose")
	})

	it("replaces spaces and punctuation with single hyphens", () => {
		expect(slugify("Rosa pastel — 50 cm!")).toBe("rosa-pastel-50-cm")
	})

	it("trims leading/trailing hyphens", () => {
		expect(slugify("  ---hola--- ")).toBe("hola")
	})

	it("preserves digits", () => {
		expect(slugify("Largo 50cm")).toBe("largo-50cm")
	})
})
```

- [ ] **Step 2: Run — fails**

Run: `pnpm test -- slug.test`
Expected: FAIL — `Cannot find module '@/lib/slug'`.

- [ ] **Step 3: Implement slugify**

`src/lib/slug.ts`:

```ts
export function slugify(input: string): string {
	return input
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
}
```

- [ ] **Step 4: Run — passes**

Run: `pnpm test -- slug.test`
Expected: PASS, 5 assertions.

- [ ] **Step 5: Add unique constraint to back-in-stock schema**

`src/lib/db/schema/back-in-stock.ts`:

```ts
import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core"
import { products } from "./products"
import { users } from "./users"

export const backInStockSubscriptions = pgTable(
	"back_in_stock_subscriptions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		productId: uuid("product_id")
			.notNull()
			.references(() => products.id, { onDelete: "cascade" }),
		email: text("email").notNull(),
		userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
		notifiedAt: timestamp("notified_at", { withTimezone: true }),
		unsubscribeToken: text("unsubscribe_token").notNull().unique(),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => ({
		byProduct: index("back_in_stock_subscriptions_product_idx").on(t.productId),
		byEmail: index("back_in_stock_subscriptions_email_idx").on(t.email),
		productEmailIdx: uniqueIndex("back_in_stock_subscriptions_product_email_idx").on(
			t.productId,
			t.email,
		),
	}),
)

export type BackInStockSubscription = typeof backInStockSubscriptions.$inferSelect
export type NewBackInStockSubscription = typeof backInStockSubscriptions.$inferInsert
```

- [ ] **Step 6: Generate migration**

Run: `pnpm db:generate`
Expected: drizzle-kit prints a single new statement adding `back_in_stock_subscriptions_product_email_idx`, writes `drizzle/0001_<random>.sql`.

- [ ] **Step 7: Apply migration**

Run: `pnpm db:migrate`
Expected: 1 statement executed, exit 0.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(db): slugify helper and unique back-in-stock subscriptions"
```

---

### Task 5: Seed sample products, attributes, and page rows

**Files:**
- Modify: `src/lib/db/seed.ts`
- Create: `public/samples/placeholder-wig.png` (any 600×600 png; can be the same `public/placeholder.png` copied)

Plan 2 has no admin product UI yet (that's Plan 3 Admin). Without seed products, every catalog page is blank. Seed 6 sample wigs, three attribute groups (Color, Largo, Estilo) with values, and page rows for shared PDP tabs (`pdp-cuidado`, `pdp-envio`, `pdp-devoluciones`) so PDP rendering has real content. Idempotent: re-running this script must not duplicate.

- [ ] **Step 1: Drop a sample image**

Copy any 600×600 PNG to `public/samples/placeholder-wig.png`:

```bash
cp public/placeholder.png public/samples/placeholder-wig.png
mkdir -p public/samples
```

(If `public/samples/` already exists or `placeholder.png` is missing, just `cp` whatever neutral image exists. Real photography arrives in Plan 4.)

- [ ] **Step 2: Extend seed with attributes**

Add to `src/lib/db/seed.ts` (insert before `async function main()`):

```ts
import { attributes, attributeValues, pages, productAttributeValues, productImages, products } from "@/lib/db/schema"
import { slugify } from "@/lib/slug"

const ATTRIBUTE_DEFAULTS: Array<{
	name: string
	slug: string
	sortOrder: number
	values: string[]
}> = [
	{
		name: "Color",
		slug: "color",
		sortOrder: 10,
		values: ["Rosa pastel", "Lila", "Negro", "Rubio platino", "Castaño chocolate"],
	},
	{
		name: "Largo",
		slug: "largo",
		sortOrder: 20,
		values: ["Corto", "Mediano", "50cm", "70cm", "100cm"],
	},
	{
		name: "Estilo",
		slug: "estilo",
		sortOrder: 30,
		values: ["Liso", "Ondulado", "Rizado", "Bob"],
	},
]

async function upsertAttributes() {
	for (const attr of ATTRIBUTE_DEFAULTS) {
		const existing = await db.select().from(attributes).where(eq(attributes.slug, attr.slug))
		let attributeId: string
		if (existing.length === 0) {
			const [row] = await db
				.insert(attributes)
				.values({ name: attr.name, slug: attr.slug, sortOrder: attr.sortOrder })
				.returning({ id: attributes.id })
			attributeId = row.id
			console.log(`Created attribute: ${attr.name}`)
		} else {
			attributeId = existing[0].id
		}
		for (let i = 0; i < attr.values.length; i++) {
			const valueName = attr.values[i]
			const valueSlug = slugify(valueName)
			const valueExisting = await db
				.select()
				.from(attributeValues)
				.where(eq(attributeValues.attributeId, attributeId))
			if (!valueExisting.some((v) => v.slug === valueSlug)) {
				await db.insert(attributeValues).values({
					attributeId,
					name: valueName,
					slug: valueSlug,
					sortOrder: (i + 1) * 10,
				})
			}
		}
	}
}
```

- [ ] **Step 3: Add product seeding**

Append to `src/lib/db/seed.ts`:

```ts
const PRODUCT_DEFAULTS: Array<{
	slug: string
	name: string
	short: string
	description: string
	pricePesos: number
	stock: number
	skuCode: string
	color: string
	largo: string
	estilo: string
}> = [
	{
		slug: "rosa-pastel-50cm",
		name: "Peluca Rosa Pastel 50cm",
		short: "Liso rosado kawaii, tono pastel uniforme.",
		description: "Fibra sintética premium · Lavable · Cabeza ajustable · 50cm de largo.",
		pricePesos: 220_000,
		stock: 5,
		skuCode: "VLJ-001",
		color: "Rosa pastel",
		largo: "50cm",
		estilo: "Liso",
	},
	{
		slug: "lila-ondulado-70cm",
		name: "Peluca Lila Ondulado 70cm",
		short: "Ondas suaves lila para un look Y2K dulce.",
		description: "Fibra resistente al calor moderado · Ajustable · 70cm.",
		pricePesos: 260_000,
		stock: 3,
		skuCode: "VLJ-002",
		color: "Lila",
		largo: "70cm",
		estilo: "Ondulado",
	},
	{
		slug: "bob-negro-corto",
		name: "Peluca Bob Negro",
		short: "Bob clásico, negro azabache, brillante.",
		description: "Corte recto · Cabeza ajustable · Para uso diario.",
		pricePesos: 180_000,
		stock: 8,
		skuCode: "VLJ-003",
		color: "Negro",
		largo: "Corto",
		estilo: "Bob",
	},
	{
		slug: "rubio-platino-100cm",
		name: "Peluca Rubio Platino XL 100cm",
		short: "Largo extra rubio platino para impacto total.",
		description: "100cm · Liso brillante · Ajustable.",
		pricePesos: 320_000,
		stock: 0,
		skuCode: "VLJ-004",
		color: "Rubio platino",
		largo: "100cm",
		estilo: "Liso",
	},
	{
		slug: "castano-rizado-mediano",
		name: "Peluca Castaño Chocolate Rizado",
		short: "Rizos definidos, tono chocolate cálido.",
		description: "Largo mediano · Rizos resistentes · Ajustable.",
		pricePesos: 240_000,
		stock: 4,
		skuCode: "VLJ-005",
		color: "Castaño chocolate",
		largo: "Mediano",
		estilo: "Rizado",
	},
	{
		slug: "rosa-pastel-corto-bob",
		name: "Peluca Rosa Pastel Bob",
		short: "Bob corto en rosa pastel — la consentida.",
		description: "Bob asimétrico · Rosa pastel · Ajustable.",
		pricePesos: 200_000,
		stock: 6,
		skuCode: "VLJ-006",
		color: "Rosa pastel",
		largo: "Corto",
		estilo: "Bob",
	},
]

async function upsertProducts() {
	const allValues = await db.select().from(attributeValues)
	const valueIdByCompound = new Map<string, string>()
	const attrRows = await db.select().from(attributes)
	const attrSlugById = new Map(attrRows.map((a) => [a.id, a.slug]))
	for (const v of allValues) {
		const attrSlug = attrSlugById.get(v.attributeId)
		if (!attrSlug) continue
		valueIdByCompound.set(`${attrSlug}:${v.slug}`, v.id)
	}

	function lookup(attrSlug: string, name: string): string {
		const id = valueIdByCompound.get(`${attrSlug}:${slugify(name)}`)
		if (!id) throw new Error(`Missing attribute value ${attrSlug}:${name}`)
		return id
	}

	for (const p of PRODUCT_DEFAULTS) {
		const existing = await db.select().from(products).where(eq(products.slug, p.slug))
		if (existing.length > 0) continue
		const [productRow] = await db
			.insert(products)
			.values({
				slug: p.slug,
				name: p.name,
				shortDescription: p.short,
				description: p.description,
				status: "active",
				priceAmount: p.pricePesos * 100,
				priceCurrency: "COP",
				stockQuantity: p.stock,
				skuCode: p.skuCode,
				dianTaxRate: 19,
			})
			.returning({ id: products.id })

		const [imageRow] = await db
			.insert(productImages)
			.values({
				productId: productRow.id,
				url: "/samples/placeholder-wig.png",
				altText: p.name,
				sortOrder: 0,
				width: 600,
				height: 600,
			})
			.returning({ id: productImages.id })

		await db.update(products).set({ primaryImageId: imageRow.id }).where(eq(products.id, productRow.id))

		await db.insert(productAttributeValues).values([
			{ productId: productRow.id, attributeValueId: lookup("color", p.color) },
			{ productId: productRow.id, attributeValueId: lookup("largo", p.largo) },
			{ productId: productRow.id, attributeValueId: lookup("estilo", p.estilo) },
		])
		console.log(`Created product: ${p.name}`)
	}
}
```

- [ ] **Step 4: Add page rows for PDP shared tabs**

Append to `src/lib/db/seed.ts`:

```ts
const PAGE_DEFAULTS = [
	{
		slug: "pdp-cuidado",
		title: "Cuidado",
		body: "Lava la peluca con shampoo suave en agua fría. No la frotes. Sécala al aire libre sobre un soporte. Evita el calor directo si no es resistente.",
	},
	{
		slug: "pdp-envio",
		title: "Envío",
		body: "Enviamos a toda Colombia. En Bucaramanga y AMB también ofrecemos contra entrega. Envío gratis comprando 3 pelucas o más.",
	},
	{
		slug: "pdp-devoluciones",
		title: "Devoluciones",
		body: "Las pelucas son artículos de uso personal y, por higiene, no se aceptan devoluciones. Si tienes dudas sobre el producto, escríbenos antes de comprar.",
	},
]

async function upsertPages() {
	for (const p of PAGE_DEFAULTS) {
		const existing = await db.select().from(pages).where(eq(pages.slug, p.slug))
		if (existing.length === 0) {
			await db.insert(pages).values({
				slug: p.slug,
				title: p.title,
				body: p.body,
				publishedAt: new Date(),
			})
			console.log(`Created page: ${p.slug}`)
		}
	}
}
```

- [ ] **Step 5: Wire new upserts into `main()`**

`src/lib/db/seed.ts` — replace `main`:

```ts
async function main() {
	await upsertOwner()
	await upsertSettings()
	await upsertZones()
	await upsertAttributes()
	await upsertProducts()
	await upsertPages()
	console.log("Seed complete.")
	process.exit(0)
}
```

- [ ] **Step 6: Run seed**

Run: `pnpm db:seed`
Expected (first run): "Created attribute: …" × 3, "Created product: …" × 6, "Created page: …" × 3, plus existing owner/settings/zones lines. Exit 0.

- [ ] **Step 7: Verify idempotency**

Run: `pnpm db:seed`
Expected: only `Owner exists`. No "Created …" lines. Exit 0.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(db): seed sample products, attributes, pdp page rows"
```

---

### Task 6: URL filter parsing + catalog queries

**Files:**
- Create: `src/lib/catalog/filters.ts`, `src/lib/catalog/queries.ts`, `tests/unit/filters.test.ts`

Centralize URL ↔ filter conversion and database reads. Filters are encoded as repeated attribute-slug params: `?color=rosa-pastel&color=lila&largo=50cm&disponible=1&sort=nuevas`. The query layer takes the parsed filter object and returns products + attribute facets in two queries (no N+1).

- [ ] **Step 1: Failing filter tests**

`tests/unit/filters.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { filtersFromSearchParams, filtersToSearchString } from "@/lib/catalog/filters"

describe("filters", () => {
	it("parses empty params to empty filters", () => {
		expect(filtersFromSearchParams({})).toEqual({
			color: [],
			largo: [],
			estilo: [],
			disponible: false,
			sort: "nuevas",
		})
	})

	it("parses multi-value attribute params", () => {
		const f = filtersFromSearchParams({ color: ["rosa-pastel", "lila"] })
		expect(f.color).toEqual(["rosa-pastel", "lila"])
	})

	it("normalizes a single string into a one-element array", () => {
		const f = filtersFromSearchParams({ color: "rosa-pastel" })
		expect(f.color).toEqual(["rosa-pastel"])
	})

	it("parses disponible=1 as true", () => {
		expect(filtersFromSearchParams({ disponible: "1" }).disponible).toBe(true)
	})

	it("falls back to nuevas for unknown sort", () => {
		expect(filtersFromSearchParams({ sort: "wat" }).sort).toBe("nuevas")
	})

	it("serializes back to a query string", () => {
		const qs = filtersToSearchString({
			color: ["rosa-pastel", "lila"],
			largo: [],
			estilo: ["bob"],
			disponible: true,
			sort: "precio-asc",
		})
		expect(qs).toBe("color=rosa-pastel&color=lila&estilo=bob&disponible=1&sort=precio-asc")
	})

	it("omits defaults when serializing", () => {
		const qs = filtersToSearchString({
			color: [],
			largo: [],
			estilo: [],
			disponible: false,
			sort: "nuevas",
		})
		expect(qs).toBe("")
	})
})
```

- [ ] **Step 2: Run — fails**

Run: `pnpm test -- filters.test`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement filters module**

`src/lib/catalog/filters.ts`:

```ts
export type Sort = "nuevas" | "precio-asc" | "precio-desc"

export type CatalogFilters = {
	color: string[]
	largo: string[]
	estilo: string[]
	disponible: boolean
	sort: Sort
}

const SORTS: Sort[] = ["nuevas", "precio-asc", "precio-desc"]

function asArray(v: string | string[] | undefined): string[] {
	if (v == null) return []
	return Array.isArray(v) ? v : [v]
}

export function filtersFromSearchParams(
	params: Record<string, string | string[] | undefined>,
): CatalogFilters {
	const sort = SORTS.includes(params.sort as Sort) ? (params.sort as Sort) : "nuevas"
	return {
		color: asArray(params.color),
		largo: asArray(params.largo),
		estilo: asArray(params.estilo),
		disponible: params.disponible === "1",
		sort,
	}
}

export function filtersToSearchString(f: CatalogFilters): string {
	const parts: string[] = []
	for (const slug of f.color) parts.push(`color=${encodeURIComponent(slug)}`)
	for (const slug of f.largo) parts.push(`largo=${encodeURIComponent(slug)}`)
	for (const slug of f.estilo) parts.push(`estilo=${encodeURIComponent(slug)}`)
	if (f.disponible) parts.push("disponible=1")
	if (f.sort !== "nuevas") parts.push(`sort=${f.sort}`)
	return parts.join("&")
}
```

- [ ] **Step 4: Run — passes**

Run: `pnpm test -- filters.test`
Expected: PASS, 7 assertions.

- [ ] **Step 5: Catalog queries**

`src/lib/catalog/queries.ts`:

```ts
import { and, asc, desc, eq, inArray, gt, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import {
	attributes,
	attributeValues,
	productAttributeValues,
	productImages,
	products,
} from "@/lib/db/schema"
import type { CatalogFilters } from "./filters"

export type ProductCard = {
	id: string
	slug: string
	name: string
	shortDescription: string | null
	priceAmount: number
	priceCurrency: string
	stockQuantity: number
	primaryImageUrl: string | null
}

export type AttributeFacet = {
	slug: string
	name: string
	values: Array<{ slug: string; name: string; count: number }>
}

const ATTRIBUTE_SLUGS = ["color", "largo", "estilo"] as const

async function resolveValueIds(
	attrSlug: (typeof ATTRIBUTE_SLUGS)[number],
	valueSlugs: string[],
): Promise<string[]> {
	if (valueSlugs.length === 0) return []
	const rows = await db
		.select({ id: attributeValues.id })
		.from(attributeValues)
		.innerJoin(attributes, eq(attributes.id, attributeValues.attributeId))
		.where(and(eq(attributes.slug, attrSlug), inArray(attributeValues.slug, valueSlugs)))
	return rows.map((r) => r.id)
}

async function productIdsMatchingValues(valueIds: string[]): Promise<string[]> {
	if (valueIds.length === 0) return []
	const rows = await db
		.select({ productId: productAttributeValues.productId })
		.from(productAttributeValues)
		.where(inArray(productAttributeValues.attributeValueId, valueIds))
	return Array.from(new Set(rows.map((r) => r.productId)))
}

export async function listProducts(filters: CatalogFilters): Promise<ProductCard[]> {
	const conditions = [eq(products.status, "active")]

	if (filters.disponible) {
		conditions.push(gt(products.stockQuantity, 0))
	}

	// For each chosen attribute, the product must match at least one of the selected values.
	for (const slug of ATTRIBUTE_SLUGS) {
		const selected = filters[slug]
		if (selected.length === 0) continue
		const valueIds = await resolveValueIds(slug, selected)
		const matching = await productIdsMatchingValues(valueIds)
		if (matching.length === 0) return []
		conditions.push(inArray(products.id, matching))
	}

	const orderBy =
		filters.sort === "precio-asc"
			? asc(products.priceAmount)
			: filters.sort === "precio-desc"
				? desc(products.priceAmount)
				: desc(products.createdAt)

	const rows = await db
		.select({
			id: products.id,
			slug: products.slug,
			name: products.name,
			shortDescription: products.shortDescription,
			priceAmount: products.priceAmount,
			priceCurrency: products.priceCurrency,
			stockQuantity: products.stockQuantity,
			imageUrl: productImages.url,
		})
		.from(products)
		.leftJoin(productImages, eq(productImages.id, products.primaryImageId))
		.where(and(...conditions))
		.orderBy(orderBy)

	return rows.map((r) => ({
		id: r.id,
		slug: r.slug,
		name: r.name,
		shortDescription: r.shortDescription,
		priceAmount: r.priceAmount,
		priceCurrency: r.priceCurrency,
		stockQuantity: r.stockQuantity,
		primaryImageUrl: r.imageUrl,
	}))
}

export async function listAttributeFacets(): Promise<AttributeFacet[]> {
	const rows = await db
		.select({
			attrSlug: attributes.slug,
			attrName: attributes.name,
			attrSortOrder: attributes.sortOrder,
			valueSlug: attributeValues.slug,
			valueName: attributeValues.name,
			valueSortOrder: attributeValues.sortOrder,
			productCount: sql<number>`count(distinct ${productAttributeValues.productId})::int`,
		})
		.from(attributes)
		.innerJoin(attributeValues, eq(attributeValues.attributeId, attributes.id))
		.leftJoin(productAttributeValues, eq(productAttributeValues.attributeValueId, attributeValues.id))
		.leftJoin(
			products,
			and(eq(products.id, productAttributeValues.productId), eq(products.status, "active")),
		)
		.where(inArray(attributes.slug, [...ATTRIBUTE_SLUGS]))
		.groupBy(attributes.slug, attributes.name, attributes.sortOrder, attributeValues.slug, attributeValues.name, attributeValues.sortOrder)
		.orderBy(asc(attributes.sortOrder), asc(attributeValues.sortOrder))

	const grouped = new Map<string, AttributeFacet>()
	for (const r of rows) {
		const existing = grouped.get(r.attrSlug)
		const valueEntry = { slug: r.valueSlug, name: r.valueName, count: r.productCount ?? 0 }
		if (existing) {
			existing.values.push(valueEntry)
		} else {
			grouped.set(r.attrSlug, {
				slug: r.attrSlug,
				name: r.attrName,
				values: [valueEntry],
			})
		}
	}
	return Array.from(grouped.values())
}

export async function getProductBySlug(slug: string) {
	const [productRow] = await db
		.select()
		.from(products)
		.where(and(eq(products.slug, slug), eq(products.status, "active")))
	if (!productRow) return null

	const images = await db
		.select()
		.from(productImages)
		.where(eq(productImages.productId, productRow.id))
		.orderBy(asc(productImages.sortOrder))

	const attrRows = await db
		.select({
			attrSlug: attributes.slug,
			attrName: attributes.name,
			valueSlug: attributeValues.slug,
			valueName: attributeValues.name,
		})
		.from(productAttributeValues)
		.innerJoin(attributeValues, eq(attributeValues.id, productAttributeValues.attributeValueId))
		.innerJoin(attributes, eq(attributes.id, attributeValues.attributeId))
		.where(eq(productAttributeValues.productId, productRow.id))
		.orderBy(asc(attributes.sortOrder))

	return {
		...productRow,
		images,
		attributes: attrRows,
	}
}

export async function listRelated(productId: string, limit = 4): Promise<ProductCard[]> {
	// Related = products sharing at least one attribute value, active, excluding self.
	const sharedValues = await db
		.select({ valueId: productAttributeValues.attributeValueId })
		.from(productAttributeValues)
		.where(eq(productAttributeValues.productId, productId))

	const valueIds = sharedValues.map((r) => r.valueId)
	if (valueIds.length === 0) return []

	const candidates = await db
		.selectDistinct({ id: productAttributeValues.productId })
		.from(productAttributeValues)
		.where(inArray(productAttributeValues.attributeValueId, valueIds))

	const candidateIds = candidates.map((c) => c.id).filter((id) => id !== productId)
	if (candidateIds.length === 0) return []

	const rows = await db
		.select({
			id: products.id,
			slug: products.slug,
			name: products.name,
			shortDescription: products.shortDescription,
			priceAmount: products.priceAmount,
			priceCurrency: products.priceCurrency,
			stockQuantity: products.stockQuantity,
			imageUrl: productImages.url,
		})
		.from(products)
		.leftJoin(productImages, eq(productImages.id, products.primaryImageId))
		.where(and(inArray(products.id, candidateIds), eq(products.status, "active")))
		.orderBy(desc(products.createdAt))
		.limit(limit)

	return rows.map((r) => ({
		id: r.id,
		slug: r.slug,
		name: r.name,
		shortDescription: r.shortDescription,
		priceAmount: r.priceAmount,
		priceCurrency: r.priceCurrency,
		stockQuantity: r.stockQuantity,
		primaryImageUrl: r.imageUrl,
	}))
}
```

- [ ] **Step 6: Typecheck**

Run: `pnpm typecheck`
Expected: clean. (If Drizzle complains about `sql<number>` cast, ensure `drizzle-orm` >= 0.45.)

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(catalog): filter parsing and product queries"
```

---

### Task 7: Reusable storefront UI primitives

**Files:**
- Create: `src/components/storefront/product-card.tsx`, `src/components/storefront/stock-badge.tsx`, `src/components/storefront/price.tsx`, `src/components/ui/modal.tsx`, `src/components/ui/empty-state.tsx`
- Modify: `package.json` (add `lucide-react`, `sonner`)
- Modify: `src/app/layout.tsx` (mount Sonner Toaster)

Pieces shared by PLP, quick-view, PDP, related-products, and the wishlist page. Small, dumb components — no data fetching.

- [ ] **Step 1: Install deps**

```bash
cd /Users/andrevital/Documents/work_stuff/av/velajuy
pnpm add lucide-react sonner
```

- [ ] **Step 2: Price**

`src/components/storefront/price.tsx`:

```tsx
import { formatCOP } from "@/lib/money"

export function Price({
	amount,
	currency = "COP",
	className,
}: {
	amount: number
	currency?: string
	className?: string
}) {
	if (currency !== "COP") {
		return <span className={className}>{amount} {currency}</span>
	}
	return <span className={className}>{formatCOP(amount)}</span>
}
```

- [ ] **Step 3: Stock badge**

`src/components/storefront/stock-badge.tsx`:

```tsx
export function StockBadge({ stock }: { stock: number }) {
	if (stock <= 0) {
		return (
			<span className="inline-flex items-center rounded-full bg-velajuy-wine/10 px-3 py-1 text-xs font-medium text-velajuy-wine">
				Agotado
			</span>
		)
	}
	if (stock <= 2) {
		return (
			<span className="inline-flex items-center rounded-full bg-velajuy-pink-soft px-3 py-1 text-xs font-medium text-velajuy-wine">
				Últimas {stock}
			</span>
		)
	}
	return (
		<span className="inline-flex items-center rounded-full bg-velajuy-pink-soft px-3 py-1 text-xs font-medium text-velajuy-wine">
			Disponible
		</span>
	)
}
```

- [ ] **Step 4: Generic modal**

`src/components/ui/modal.tsx`:

```tsx
"use client"

import { X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"

export function Modal({
	children,
	onClose,
}: {
	children: React.ReactNode
	onClose?: () => void
}) {
	const router = useRouter()
	const dialogRef = useRef<HTMLDialogElement>(null)

	useEffect(() => {
		const el = dialogRef.current
		if (!el) return
		if (!el.open) el.showModal()
	}, [])

	function handleClose() {
		if (onClose) onClose()
		else router.back()
	}

	return (
		<dialog
			ref={dialogRef}
			onClose={handleClose}
			onClick={(e) => {
				if (e.target === dialogRef.current) handleClose()
			}}
			className="m-auto w-full max-w-3xl rounded-2xl bg-white p-0 text-velajuy-wine backdrop:bg-velajuy-wine/40 backdrop:backdrop-blur-sm"
		>
			<button
				type="button"
				onClick={handleClose}
				aria-label="Cerrar"
				className="absolute right-4 top-4 rounded-full bg-velajuy-pink-soft p-2 text-velajuy-wine"
			>
				<X size={18} />
			</button>
			<div className="p-6">{children}</div>
		</dialog>
	)
}
```

- [ ] **Step 5: Empty state**

`src/components/ui/empty-state.tsx`:

```tsx
export function EmptyState({
	title,
	description,
	action,
}: {
	title: string
	description?: string
	action?: React.ReactNode
}) {
	return (
		<div className="rounded-2xl border border-dashed border-velajuy-wine/20 bg-velajuy-cream px-6 py-12 text-center">
			<h2 className="text-xl font-semibold text-velajuy-wine">{title}</h2>
			{description ? (
				<p className="mt-2 text-sm text-velajuy-wine-soft">{description}</p>
			) : null}
			{action ? <div className="mt-6">{action}</div> : null}
		</div>
	)
}
```

- [ ] **Step 6: Product card**

`src/components/storefront/product-card.tsx`:

```tsx
import type { Route } from "next"
import Image from "next/image"
import Link from "next/link"
import { StockBadge } from "./stock-badge"
import { Price } from "./price"
import type { ProductCard as ProductCardData } from "@/lib/catalog/queries"

export function ProductCard({ product }: { product: ProductCardData }) {
	const href = `/producto/${product.slug}` as Route
	return (
		<article className="group rounded-2xl bg-white p-3 shadow-sm transition hover:shadow-md">
			<Link href={href} className="block overflow-hidden rounded-xl">
				<div className="relative aspect-square bg-velajuy-pink-soft">
					{product.primaryImageUrl ? (
						<Image
							src={product.primaryImageUrl}
							alt={product.name}
							fill
							sizes="(min-width: 1024px) 25vw, 50vw"
							className="object-cover transition group-hover:scale-105"
						/>
					) : null}
				</div>
			</Link>
			<div className="mt-3 flex items-start justify-between gap-2">
				<div>
					<Link href={href} className="text-sm font-medium text-velajuy-wine">
						{product.name}
					</Link>
					<Price
						amount={product.priceAmount}
						currency={product.priceCurrency}
						className="mt-1 block text-sm text-velajuy-wine-soft"
					/>
				</div>
				<StockBadge stock={product.stockQuantity} />
			</div>
			<div className="mt-3 flex gap-2">
				<Link
					href={`/catalogo?quick=${product.slug}` as Route}
					scroll={false}
					className="flex-1 rounded-lg bg-velajuy-pink-soft px-3 py-2 text-center text-xs font-medium text-velajuy-wine"
				>
					Vista rápida
				</Link>
				<Link
					href={href}
					className="flex-1 rounded-lg bg-velajuy-wine px-3 py-2 text-center text-xs font-medium text-white"
				>
					Ver
				</Link>
			</div>
		</article>
	)
}
```

- [ ] **Step 7: Mount Sonner toaster**

`src/app/layout.tsx`:

```tsx
import type { Metadata } from "next"
import { Toaster } from "sonner"
import "./globals.css"

export const metadata: Metadata = {
	title: "Velajuy Pelucas",
	description: "Pelucas en Colombia — Velajuy",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="es-CO">
			<body className="bg-velajuy-pink-soft text-velajuy-wine antialiased">
				{children}
				<Toaster richColors position="top-center" />
			</body>
		</html>
	)
}
```

- [ ] **Step 8: Typecheck**

Run: `pnpm typecheck`
Expected: clean.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(ui): product card, stock badge, modal, sonner toaster"
```

---

### Task 8: PLP — filter sidebar, sort, grid

**Files:**
- Rewrite: `src/app/(storefront)/catalogo/page.tsx`
- Create: `src/app/(storefront)/catalogo/filter-sidebar.tsx`
- Create: `src/app/(storefront)/catalogo/sort-select.tsx`

PLP renders Server-side: parse filters → fetch products + facets → render. Filter sidebar is client-side (controlled checkboxes + a "Aplicar" button that pushes a new URL).

- [ ] **Step 1: Filter sidebar**

`src/app/(storefront)/catalogo/filter-sidebar.tsx`:

```tsx
"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { filtersFromSearchParams, filtersToSearchString } from "@/lib/catalog/filters"
import type { AttributeFacet } from "@/lib/catalog/queries"

const ATTRIBUTE_KEYS = ["color", "largo", "estilo"] as const

export function FilterSidebar({ facets }: { facets: AttributeFacet[] }) {
	const router = useRouter()
	const searchParams = useSearchParams()
	const current = useMemo(() => {
		const raw: Record<string, string | string[]> = {}
		for (const key of ATTRIBUTE_KEYS) raw[key] = searchParams.getAll(key)
		const dispo = searchParams.get("disponible")
		if (dispo) raw.disponible = dispo
		const sort = searchParams.get("sort")
		if (sort) raw.sort = sort
		return filtersFromSearchParams(raw)
	}, [searchParams])

	const [pending, setPending] = useState(current)

	// Keep the form in sync when the URL is changed externally (Apply, sort, back/forward).
	useEffect(() => {
		setPending(current)
	}, [current])

	function toggle(attr: (typeof ATTRIBUTE_KEYS)[number], slug: string) {
		setPending((prev) => {
			const next = new Set(prev[attr])
			if (next.has(slug)) next.delete(slug)
			else next.add(slug)
			return { ...prev, [attr]: Array.from(next) }
		})
	}

	function apply() {
		const qs = filtersToSearchString(pending)
		router.push(qs ? `/catalogo?${qs}` : "/catalogo")
	}

	function reset() {
		const cleared = { color: [], largo: [], estilo: [], disponible: false, sort: pending.sort }
		setPending(cleared)
		const qs = filtersToSearchString(cleared)
		router.push(qs ? `/catalogo?${qs}` : "/catalogo")
	}

	return (
		<aside className="space-y-6">
			{facets.map((facet) => {
				const attr = facet.slug as (typeof ATTRIBUTE_KEYS)[number]
				if (!ATTRIBUTE_KEYS.includes(attr)) return null
				return (
					<section key={facet.slug}>
						<h3 className="mb-2 text-sm font-semibold text-velajuy-wine">{facet.name}</h3>
						<ul className="space-y-1">
							{facet.values.map((v) => (
								<li key={v.slug}>
									<label className="flex cursor-pointer items-center gap-2 text-sm text-velajuy-wine-soft">
										<input
											type="checkbox"
											checked={pending[attr].includes(v.slug)}
											onChange={() => toggle(attr, v.slug)}
											className="accent-velajuy-wine"
										/>
										<span>
											{v.name}{" "}
											<span className="text-xs text-velajuy-wine-soft/70">({v.count})</span>
										</span>
									</label>
								</li>
							))}
						</ul>
					</section>
				)
			})}

			<section>
				<label className="flex cursor-pointer items-center gap-2 text-sm text-velajuy-wine">
					<input
						type="checkbox"
						checked={pending.disponible}
						onChange={(e) =>
							setPending((prev) => ({ ...prev, disponible: e.target.checked }))
						}
						className="accent-velajuy-wine"
					/>
					Solo disponibles
				</label>
			</section>

			<div className="flex gap-2">
				<button
					type="button"
					onClick={apply}
					className="flex-1 rounded-lg bg-velajuy-wine px-3 py-2 text-sm font-medium text-white"
				>
					Aplicar
				</button>
				<button
					type="button"
					onClick={reset}
					className="rounded-lg border border-velajuy-wine/30 px-3 py-2 text-sm text-velajuy-wine"
				>
					Limpiar
				</button>
			</div>
		</aside>
	)
}
```

- [ ] **Step 2: Sort select**

`src/app/(storefront)/catalogo/sort-select.tsx`:

```tsx
"use client"

import { useRouter, useSearchParams } from "next/navigation"
import type { Sort } from "@/lib/catalog/filters"

const OPTIONS: Array<{ value: Sort; label: string }> = [
	{ value: "nuevas", label: "Nuevas" },
	{ value: "precio-asc", label: "Precio: menor a mayor" },
	{ value: "precio-desc", label: "Precio: mayor a menor" },
]

export function SortSelect({ current }: { current: Sort }) {
	const router = useRouter()
	const params = useSearchParams()

	function onChange(value: Sort) {
		const next = new URLSearchParams(params)
		if (value === "nuevas") next.delete("sort")
		else next.set("sort", value)
		const qs = next.toString()
		router.push(qs ? `/catalogo?${qs}` : "/catalogo")
	}

	return (
		<label className="flex items-center gap-2 text-sm text-velajuy-wine">
			<span>Ordenar:</span>
			<select
				value={current}
				onChange={(e) => onChange(e.target.value as Sort)}
				className="rounded-lg border border-velajuy-wine/20 bg-white px-3 py-1.5 text-sm text-velajuy-wine"
			>
				{OPTIONS.map((opt) => (
					<option key={opt.value} value={opt.value}>
						{opt.label}
					</option>
				))}
			</select>
		</label>
	)
}
```

- [ ] **Step 3: PLP page**

`src/app/(storefront)/catalogo/page.tsx`:

```tsx
import { filtersFromSearchParams } from "@/lib/catalog/filters"
import { listAttributeFacets, listProducts } from "@/lib/catalog/queries"
import { ProductCard } from "@/components/storefront/product-card"
import { EmptyState } from "@/components/ui/empty-state"
import { FilterSidebar } from "./filter-sidebar"
import { SortSelect } from "./sort-select"

export default async function CatalogoPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
	const params = await searchParams
	const filters = filtersFromSearchParams(params)
	const [items, facets] = await Promise.all([listProducts(filters), listAttributeFacets()])

	return (
		<main className="mx-auto max-w-6xl px-6 py-12">
			<header className="flex items-end justify-between">
				<h1 className="text-3xl font-bold text-velajuy-wine">Catálogo</h1>
				<SortSelect current={filters.sort} />
			</header>

			<div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[16rem_1fr]">
				<FilterSidebar facets={facets} />
				<section>
					{items.length === 0 ? (
						<EmptyState
							title="No encontramos pelucas con esos filtros"
							description="Prueba con menos filtros o limpia la selección."
						/>
					) : (
						<ul className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
							{items.map((p) => (
								<li key={p.id}>
									<ProductCard product={p} />
								</li>
							))}
						</ul>
					)}
				</section>
			</div>
		</main>
	)
}
```

- [ ] **Step 4: Verify in dev**

Run: `pnpm dev`
Visit `/catalogo`. Expected: 6 product cards in a grid, filter sidebar with Color/Largo/Estilo checkboxes + counts, sort dropdown. Apply a filter (e.g. Color = "Rosa pastel") → URL updates → grid filters to 2 products. Toggle "Solo disponibles" → "Rubio platino XL" (stock 0) disappears. Ctrl-C.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(catalog): PLP with filter sidebar, sort, product grid"
```

---

### Task 9: Quick-view modal via intercepted route

**Files:**
- Modify: `src/app/(storefront)/layout.tsx` (add `@modal` parallel slot)
- Create: `src/app/(storefront)/@modal/default.tsx`
- Create: `src/app/(storefront)/@modal/(.)producto/[slug]/page.tsx`
- Create: `src/app/(storefront)/quick-view-modal.tsx`

Next.js intercepted route renders `producto/[slug]` as a modal over PLP when the navigation originates within `(storefront)`. Hard navigation (refresh, direct link) falls through to the real PDP page.

- [ ] **Step 1: Storefront layout adds @modal slot**

`src/app/(storefront)/layout.tsx`:

```tsx
import { StorefrontFooter } from "@/components/storefront/footer"
import { StorefrontHeader } from "@/components/storefront/header"

export default function StorefrontLayout({
	children,
	modal,
}: {
	children: React.ReactNode
	modal: React.ReactNode
}) {
	return (
		<div className="flex min-h-screen flex-col">
			<StorefrontHeader />
			<div className="flex-1">{children}</div>
			<StorefrontFooter />
			{modal}
		</div>
	)
}
```

- [ ] **Step 2: Default slot (no modal)**

`src/app/(storefront)/@modal/default.tsx`:

```tsx
export default function ModalDefault() {
	return null
}
```

- [ ] **Step 3: Quick-view shell**

`src/app/(storefront)/quick-view-modal.tsx`:

```tsx
"use client"

import Image from "next/image"
import { Modal } from "@/components/ui/modal"
import { Price } from "@/components/storefront/price"
import { StockBadge } from "@/components/storefront/stock-badge"

type Props = {
	name: string
	priceAmount: number
	priceCurrency: string
	stockQuantity: number
	imageUrl: string | null
	shortDescription: string | null
	attributes: Array<{ attrName: string; valueName: string }>
}

export function QuickViewModal(p: Props) {
	return (
		<Modal>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				<div className="relative aspect-square overflow-hidden rounded-xl bg-velajuy-pink-soft">
					{p.imageUrl ? (
						<Image
							src={p.imageUrl}
							alt={p.name}
							fill
							sizes="(min-width: 768px) 50vw, 100vw"
							className="object-cover"
						/>
					) : null}
				</div>
				<div>
					<h2 className="text-2xl font-bold text-velajuy-wine">{p.name}</h2>
					<div className="mt-2 flex items-center gap-3">
						<Price
							amount={p.priceAmount}
							currency={p.priceCurrency}
							className="text-lg text-velajuy-wine-soft"
						/>
						<StockBadge stock={p.stockQuantity} />
					</div>
					{p.shortDescription ? (
						<p className="mt-3 text-sm text-velajuy-wine-soft">{p.shortDescription}</p>
					) : null}
					<dl className="mt-4 space-y-1 text-sm text-velajuy-wine-soft">
						{p.attributes.map((a) => (
							<div key={a.attrName} className="flex gap-2">
								<dt className="font-medium text-velajuy-wine">{a.attrName}:</dt>
								<dd>{a.valueName}</dd>
							</div>
						))}
					</dl>
				</div>
			</div>
		</Modal>
	)
}
```

- [ ] **Step 4: Intercepted route**

`src/app/(storefront)/@modal/(.)producto/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation"
import { getProductBySlug } from "@/lib/catalog/queries"
import { QuickViewModal } from "../../../quick-view-modal"

export default async function QuickViewRoute({
	params,
}: {
	params: Promise<{ slug: string }>
}) {
	const { slug } = await params
	const product = await getProductBySlug(slug)
	if (!product) notFound()
	const primary = product.images[0] ?? null
	return (
		<QuickViewModal
			name={product.name}
			priceAmount={product.priceAmount}
			priceCurrency={product.priceCurrency}
			stockQuantity={product.stockQuantity}
			imageUrl={primary?.url ?? null}
			shortDescription={product.shortDescription}
			attributes={product.attributes.map((a) => ({ attrName: a.attrName, valueName: a.valueName }))}
		/>
	)
}
```

- [ ] **Step 5: Adjust product-card quick-view link**

`src/components/storefront/product-card.tsx` — replace the `/catalogo?quick=` link with `/producto/${slug}` so it triggers the intercept when clicked from PLP:

```tsx
<Link
	href={href}
	scroll={false}
	className="flex-1 rounded-lg bg-velajuy-pink-soft px-3 py-2 text-center text-xs font-medium text-velajuy-wine"
>
	Vista rápida
</Link>
```

Note: this turns the "Vista rápida" and "Ver" buttons into the same link target. Keep both for visual hierarchy but route to the same path; the intercept handles modal vs full page. Drop the now-duplicate "Ver" button:

```tsx
import type { Route } from "next"
import Image from "next/image"
import Link from "next/link"
import { StockBadge } from "./stock-badge"
import { Price } from "./price"
import type { ProductCard as ProductCardData } from "@/lib/catalog/queries"

export function ProductCard({ product }: { product: ProductCardData }) {
	const href = `/producto/${product.slug}` as Route
	return (
		<article className="group rounded-2xl bg-white p-3 shadow-sm transition hover:shadow-md">
			<Link href={href} scroll={false} className="block overflow-hidden rounded-xl">
				<div className="relative aspect-square bg-velajuy-pink-soft">
					{product.primaryImageUrl ? (
						<Image
							src={product.primaryImageUrl}
							alt={product.name}
							fill
							sizes="(min-width: 1024px) 25vw, 50vw"
							className="object-cover transition group-hover:scale-105"
						/>
					) : null}
				</div>
			</Link>
			<div className="mt-3 flex items-start justify-between gap-2">
				<div>
					<Link href={href} scroll={false} className="text-sm font-medium text-velajuy-wine">
						{product.name}
					</Link>
					<Price
						amount={product.priceAmount}
						currency={product.priceCurrency}
						className="mt-1 block text-sm text-velajuy-wine-soft"
					/>
				</div>
				<StockBadge stock={product.stockQuantity} />
			</div>
		</article>
	)
}
```

- [ ] **Step 6: Verify**

Run: `pnpm dev`
Visit `/catalogo`. Click on any product card → URL changes to `/producto/<slug>`, modal opens over PLP showing image + name + price + attributes. Close the modal (X or backdrop) → URL goes back to `/catalogo`. Now copy the `/producto/<slug>` URL into a new tab → full PDP would render (next task creates it; right now the route doesn't exist yet and shows the default Next.js not-found). That's expected — Task 10 fixes it. Ctrl-C.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(catalog): quick-view modal via intercepted route"
```

---

### Task 10: PDP — page, gallery, product info

**Files:**
- Create: `src/app/(storefront)/producto/[slug]/page.tsx`
- Create: `src/app/(storefront)/producto/[slug]/gallery.tsx`
- Create: `src/app/(storefront)/producto/[slug]/product-info.tsx`

Main PDP route. Server-side fetch, client-side gallery for thumbnail switching. The "Agregar al carrito" button is a stub `<button disabled>` for now — Cart belongs to a later plan; the button shape goes in to lock layout.

- [ ] **Step 1: Gallery**

`src/app/(storefront)/producto/[slug]/gallery.tsx`:

```tsx
"use client"

import Image from "next/image"
import { useState } from "react"

type Img = { id: string; url: string; altText: string | null }

export function ProductGallery({ images, productName }: { images: Img[]; productName: string }) {
	const [active, setActive] = useState(0)
	const current = images[active] ?? images[0]

	return (
		<div className="space-y-3">
			<div className="relative aspect-square overflow-hidden rounded-2xl bg-velajuy-pink-soft">
				{current ? (
					<Image
						src={current.url}
						alt={current.altText ?? productName}
						fill
						sizes="(min-width: 1024px) 50vw, 100vw"
						className="object-cover"
						priority
					/>
				) : null}
			</div>
			{images.length > 1 ? (
				<ul className="flex gap-2">
					{images.map((img, i) => (
						<li key={img.id}>
							<button
								type="button"
								onClick={() => setActive(i)}
								aria-label={`Imagen ${i + 1}`}
								className={`relative h-16 w-16 overflow-hidden rounded-lg ${
									i === active ? "ring-2 ring-velajuy-wine" : "ring-1 ring-velajuy-wine/10"
								}`}
							>
								<Image src={img.url} alt={img.altText ?? productName} fill className="object-cover" />
							</button>
						</li>
					))}
				</ul>
			) : null}
		</div>
	)
}
```

- [ ] **Step 2: Product info panel**

`src/app/(storefront)/producto/[slug]/product-info.tsx`:

```tsx
import { Price } from "@/components/storefront/price"
import { StockBadge } from "@/components/storefront/stock-badge"

type Attribute = { attrName: string; valueName: string }

export function ProductInfo({
	name,
	priceAmount,
	priceCurrency,
	stockQuantity,
	shortDescription,
	attributes,
	wishlistSlot,
	backInStockSlot,
}: {
	name: string
	priceAmount: number
	priceCurrency: string
	stockQuantity: number
	shortDescription: string | null
	attributes: Attribute[]
	wishlistSlot: React.ReactNode
	backInStockSlot: React.ReactNode
}) {
	const outOfStock = stockQuantity <= 0
	return (
		<section className="space-y-5">
			<header>
				<h1 className="text-3xl font-bold text-velajuy-wine">{name}</h1>
				<div className="mt-2 flex items-center gap-3">
					<Price
						amount={priceAmount}
						currency={priceCurrency}
						className="text-xl text-velajuy-wine-soft"
					/>
					<StockBadge stock={stockQuantity} />
				</div>
			</header>

			{shortDescription ? (
				<p className="text-velajuy-wine-soft">{shortDescription}</p>
			) : null}

			<dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-2xl bg-velajuy-cream p-4 text-sm">
				{attributes.map((a) => (
					<div key={a.attrName} className="flex flex-col">
						<dt className="text-xs uppercase tracking-wide text-velajuy-wine-soft">{a.attrName}</dt>
						<dd className="font-medium text-velajuy-wine">{a.valueName}</dd>
					</div>
				))}
			</dl>

			<div className="flex flex-wrap items-center gap-3">
				<button
					type="button"
					disabled
					className="rounded-xl bg-velajuy-wine px-6 py-3 font-medium text-white disabled:opacity-60"
					title="Próximamente"
				>
					Agregar al carrito
				</button>
				{wishlistSlot}
			</div>

			{outOfStock ? backInStockSlot : null}
		</section>
	)
}
```

- [ ] **Step 3: PDP route**

`src/app/(storefront)/producto/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation"
import { getProductBySlug, listRelated } from "@/lib/catalog/queries"
import { ProductGallery } from "./gallery"
import { ProductInfo } from "./product-info"

export default async function ProductoPage({
	params,
}: {
	params: Promise<{ slug: string }>
}) {
	const { slug } = await params
	const product = await getProductBySlug(slug)
	if (!product) notFound()

	const related = await listRelated(product.id, 4)

	return (
		<main className="mx-auto max-w-6xl px-6 py-12">
			<div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
				<ProductGallery
					images={product.images.map((i) => ({ id: i.id, url: i.url, altText: i.altText }))}
					productName={product.name}
				/>
				<ProductInfo
					name={product.name}
					priceAmount={product.priceAmount}
					priceCurrency={product.priceCurrency}
					stockQuantity={product.stockQuantity}
					shortDescription={product.shortDescription}
					attributes={product.attributes.map((a) => ({ attrName: a.attrName, valueName: a.valueName }))}
					wishlistSlot={null /* filled in Task 12 */}
					backInStockSlot={null /* filled in Task 14 */}
				/>
			</div>

			{related.length > 0 ? (
				<section className="mt-16">
					<h2 className="mb-4 text-xl font-semibold text-velajuy-wine">También te puede gustar</h2>
					<ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
						{related.map((p) => (
							<li key={p.id}>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<a
									href={`/producto/${p.slug}`}
									className="block rounded-2xl bg-white p-3 shadow-sm hover:shadow-md"
								>
									<div className="relative aspect-square overflow-hidden rounded-xl bg-velajuy-pink-soft">
										{p.primaryImageUrl ? (
											<img
												src={p.primaryImageUrl}
												alt={p.name}
												className="absolute inset-0 h-full w-full object-cover"
											/>
										) : null}
									</div>
									<div className="mt-2 text-sm font-medium text-velajuy-wine">{p.name}</div>
								</a>
							</li>
						))}
					</ul>
				</section>
			) : null}
		</main>
	)
}
```

(Inline `<img>` here just to keep this task small; Task 11 replaces this section with a proper `RelatedProducts` component using `<Image>` + `ProductCard`.)

- [ ] **Step 4: Verify**

Run: `pnpm dev`
Visit `/producto/rosa-pastel-50cm`. Expected: gallery on left, info panel on right with name + price + Disponible badge + attributes + a disabled "Agregar al carrito" button. Refresh the page → still works (direct nav, no modal intercept). Visit `/producto/rubio-platino-100cm` → shows "Agotado" badge. Visit `/producto/does-not-exist` → 404. Ctrl-C.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(pdp): page, gallery, product info"
```

---

### Task 11: PDP tabs + related products component

**Files:**
- Create: `src/app/(storefront)/producto/[slug]/product-tabs.tsx`
- Create: `src/app/(storefront)/producto/[slug]/related-products.tsx`
- Modify: `src/app/(storefront)/producto/[slug]/page.tsx`

Tabs (Descripción · Cuidado · Envío · Devoluciones). Descripción uses `product.description`. The other three load from the `pages` table by slug (`pdp-cuidado`, `pdp-envio`, `pdp-devoluciones`) seeded in Task 5; if absent, render a default fallback.

- [ ] **Step 1: Page fetcher**

Append to `src/lib/catalog/queries.ts`:

```ts
import { pages } from "@/lib/db/schema"

export async function getPagesBySlugs(slugs: string[]): Promise<Record<string, string>> {
	if (slugs.length === 0) return {}
	const rows = await db.select().from(pages).where(inArray(pages.slug, slugs))
	const out: Record<string, string> = {}
	for (const r of rows) {
		out[r.slug] = typeof r.body === "string" ? r.body : JSON.stringify(r.body ?? "")
	}
	return out
}
```

- [ ] **Step 2: Tabs component**

`src/app/(storefront)/producto/[slug]/product-tabs.tsx`:

```tsx
"use client"

import { useState } from "react"

type Tab = { key: string; label: string; body: string }

export function ProductTabs({ tabs }: { tabs: Tab[] }) {
	const [active, setActive] = useState(tabs[0]?.key ?? "descripcion")
	const current = tabs.find((t) => t.key === active) ?? tabs[0]

	return (
		<section className="mt-12">
			<ul className="flex flex-wrap gap-2 border-b border-velajuy-wine/10">
				{tabs.map((t) => (
					<li key={t.key}>
						<button
							type="button"
							onClick={() => setActive(t.key)}
							className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
								active === t.key
									? "border-velajuy-wine text-velajuy-wine"
									: "border-transparent text-velajuy-wine-soft hover:text-velajuy-wine"
							}`}
						>
							{t.label}
						</button>
					</li>
				))}
			</ul>
			<div className="mt-4 whitespace-pre-line text-sm leading-6 text-velajuy-wine-soft">
				{current?.body}
			</div>
		</section>
	)
}
```

- [ ] **Step 3: Related products component**

`src/app/(storefront)/producto/[slug]/related-products.tsx`:

```tsx
import { ProductCard } from "@/components/storefront/product-card"
import type { ProductCard as ProductCardData } from "@/lib/catalog/queries"

export function RelatedProducts({ items }: { items: ProductCardData[] }) {
	if (items.length === 0) return null
	return (
		<section className="mt-16">
			<h2 className="mb-4 text-xl font-semibold text-velajuy-wine">También te puede gustar</h2>
			<ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				{items.map((p) => (
					<li key={p.id}>
						<ProductCard product={p} />
					</li>
				))}
			</ul>
		</section>
	)
}
```

- [ ] **Step 4: PDP page integrates tabs + RelatedProducts**

`src/app/(storefront)/producto/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation"
import { getPagesBySlugs, getProductBySlug, listRelated } from "@/lib/catalog/queries"
import { ProductGallery } from "./gallery"
import { ProductInfo } from "./product-info"
import { ProductTabs } from "./product-tabs"
import { RelatedProducts } from "./related-products"

const TAB_PAGE_SLUGS = ["pdp-cuidado", "pdp-envio", "pdp-devoluciones"]

const FALLBACK_TABS: Record<string, { label: string; body: string }> = {
	"pdp-cuidado": {
		label: "Cuidado",
		body: "Lava la peluca con shampoo suave en agua fría. Sécala al aire y guárdala sobre un soporte.",
	},
	"pdp-envio": {
		label: "Envío",
		body: "Enviamos a toda Colombia. Envío gratis comprando 3 pelucas o más.",
	},
	"pdp-devoluciones": {
		label: "Devoluciones",
		body: "Por higiene, las pelucas no aceptan devoluciones. Escríbenos antes de comprar si tienes dudas.",
	},
}

export default async function ProductoPage({
	params,
}: {
	params: Promise<{ slug: string }>
}) {
	const { slug } = await params
	const product = await getProductBySlug(slug)
	if (!product) notFound()

	const [related, pageBodies] = await Promise.all([
		listRelated(product.id, 4),
		getPagesBySlugs(TAB_PAGE_SLUGS),
	])

	const tabs = [
		{
			key: "descripcion",
			label: "Descripción",
			body: product.description ?? product.shortDescription ?? "",
		},
		{
			key: "cuidado",
			label: FALLBACK_TABS["pdp-cuidado"].label,
			body: pageBodies["pdp-cuidado"] ?? FALLBACK_TABS["pdp-cuidado"].body,
		},
		{
			key: "envio",
			label: FALLBACK_TABS["pdp-envio"].label,
			body: pageBodies["pdp-envio"] ?? FALLBACK_TABS["pdp-envio"].body,
		},
		{
			key: "devoluciones",
			label: FALLBACK_TABS["pdp-devoluciones"].label,
			body: pageBodies["pdp-devoluciones"] ?? FALLBACK_TABS["pdp-devoluciones"].body,
		},
	]

	return (
		<main className="mx-auto max-w-6xl px-6 py-12">
			<div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
				<ProductGallery
					images={product.images.map((i) => ({ id: i.id, url: i.url, altText: i.altText }))}
					productName={product.name}
				/>
				<ProductInfo
					name={product.name}
					priceAmount={product.priceAmount}
					priceCurrency={product.priceCurrency}
					stockQuantity={product.stockQuantity}
					shortDescription={product.shortDescription}
					attributes={product.attributes.map((a) => ({ attrName: a.attrName, valueName: a.valueName }))}
					wishlistSlot={null}
					backInStockSlot={null}
				/>
			</div>

			<ProductTabs tabs={tabs} />

			<RelatedProducts items={related} />
		</main>
	)
}
```

- [ ] **Step 5: Verify**

Run: `pnpm dev`
Visit `/producto/rosa-pastel-50cm`. Expected: 4 tabs (Descripción active by default). Clicking each shows that body. Related products grid renders below if any share an attribute. Ctrl-C.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(pdp): tabs (descripcion, cuidado, envio, devoluciones) and related products"
```

---

### Task 12: Wishlist server actions, queries, button

**Files:**
- Create: `src/lib/wishlist/queries.ts`, `src/lib/wishlist/actions.ts`
- Create: `src/app/(storefront)/producto/[slug]/wishlist-button.tsx`
- Modify: `src/app/(storefront)/producto/[slug]/page.tsx` (pass `wishlistSlot`)

Logged-in only. Heart button toggles a row in `wishlist_items`. Server action returns the new state; client component shows a toast on success. Unauthenticated click sends user to `/ingresar?redirect=/producto/<slug>`.

- [ ] **Step 1: Queries**

`src/lib/wishlist/queries.ts`:

```ts
import { and, desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import {
	productImages,
	products,
	wishlistItems,
} from "@/lib/db/schema"

export async function isInWishlist(userId: string, productId: string): Promise<boolean> {
	const [row] = await db
		.select({ productId: wishlistItems.productId })
		.from(wishlistItems)
		.where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId)))
		.limit(1)
	return !!row
}

export async function listUserWishlist(userId: string) {
	return db
		.select({
			id: products.id,
			slug: products.slug,
			name: products.name,
			shortDescription: products.shortDescription,
			priceAmount: products.priceAmount,
			priceCurrency: products.priceCurrency,
			stockQuantity: products.stockQuantity,
			primaryImageUrl: productImages.url,
			addedAt: wishlistItems.addedAt,
		})
		.from(wishlistItems)
		.innerJoin(products, eq(products.id, wishlistItems.productId))
		.leftJoin(productImages, eq(productImages.id, products.primaryImageId))
		.where(eq(wishlistItems.userId, userId))
		.orderBy(desc(wishlistItems.addedAt))
}
```

- [ ] **Step 2: Server actions**

`src/lib/wishlist/actions.ts`:

```ts
"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { wishlistItems } from "@/lib/db/schema"
import { requireSession } from "@/lib/auth-guards"

export async function addToWishlist(productId: string): Promise<{ inWishlist: true }> {
	const session = await requireSession()
	await db
		.insert(wishlistItems)
		.values({ userId: session.user.id, productId })
		.onConflictDoNothing()
	revalidatePath("/cuenta/wishlist")
	return { inWishlist: true }
}

export async function removeFromWishlist(productId: string): Promise<{ inWishlist: false }> {
	const session = await requireSession()
	await db
		.delete(wishlistItems)
		.where(and(eq(wishlistItems.userId, session.user.id), eq(wishlistItems.productId, productId)))
	revalidatePath("/cuenta/wishlist")
	return { inWishlist: false }
}
```

- [ ] **Step 3: Wishlist button**

`src/app/(storefront)/producto/[slug]/wishlist-button.tsx`:

```tsx
"use client"

import { Heart } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { addToWishlist, removeFromWishlist } from "@/lib/wishlist/actions"

export function WishlistButton({
	productId,
	productSlug,
	initialInWishlist,
	isAuthenticated,
}: {
	productId: string
	productSlug: string
	initialInWishlist: boolean
	isAuthenticated: boolean
}) {
	const router = useRouter()
	const [inWishlist, setInWishlist] = useState(initialInWishlist)
	const [pending, startTransition] = useTransition()

	function handleClick() {
		if (!isAuthenticated) {
			router.push(`/ingresar?redirect=/producto/${productSlug}`)
			return
		}
		startTransition(async () => {
			if (inWishlist) {
				const r = await removeFromWishlist(productId)
				setInWishlist(r.inWishlist)
				toast.success("Quitada de tu lista")
			} else {
				const r = await addToWishlist(productId)
				setInWishlist(r.inWishlist)
				toast.success("¡Agregada a tu lista!")
			}
		})
	}

	return (
		<button
			type="button"
			onClick={handleClick}
			disabled={pending}
			aria-pressed={inWishlist}
			aria-label={inWishlist ? "Quitar de la lista de deseos" : "Agregar a la lista de deseos"}
			className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition disabled:opacity-60 ${
				inWishlist
					? "border-velajuy-wine bg-velajuy-pink-soft text-velajuy-wine"
					: "border-velajuy-wine/30 text-velajuy-wine"
			}`}
		>
			<Heart size={18} fill={inWishlist ? "currentColor" : "none"} />
			{inWishlist ? "En tu lista" : "Guardar"}
		</button>
	)
}
```

- [ ] **Step 4: PDP wires `wishlistSlot`**

Modify `src/app/(storefront)/producto/[slug]/page.tsx` — replace its imports and inline the session lookup + `WishlistButton`:

```tsx
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { getPagesBySlugs, getProductBySlug, listRelated } from "@/lib/catalog/queries"
import { isInWishlist } from "@/lib/wishlist/queries"
import { ProductGallery } from "./gallery"
import { ProductInfo } from "./product-info"
import { ProductTabs } from "./product-tabs"
import { RelatedProducts } from "./related-products"
import { WishlistButton } from "./wishlist-button"
```

Then inside `ProductoPage`, after `if (!product) notFound()`:

```tsx
const session = await auth.api.getSession({ headers: await headers() })
const userId = session?.user.id ?? null
const startingInWishlist = userId ? await isInWishlist(userId, product.id) : false
```

And pass:

```tsx
wishlistSlot={
	<WishlistButton
		productId={product.id}
		productSlug={product.slug}
		initialInWishlist={startingInWishlist}
		isAuthenticated={!!userId}
	/>
}
```

- [ ] **Step 5: Customer wishlist page**

`src/app/cuenta/wishlist/page.tsx`:

```tsx
import Link from "next/link"
import { requireSession } from "@/lib/auth-guards"
import { listUserWishlist } from "@/lib/wishlist/queries"
import { ProductCard } from "@/components/storefront/product-card"
import { EmptyState } from "@/components/ui/empty-state"

export default async function WishlistPage() {
	const session = await requireSession("/cuenta/wishlist")
	const items = await listUserWishlist(session.user.id)

	return (
		<main className="mx-auto max-w-5xl px-6 py-12">
			<h1 className="text-3xl font-bold text-velajuy-wine">Mi lista de deseos</h1>
			{items.length === 0 ? (
				<div className="mt-8">
					<EmptyState
						title="Tu lista está vacía"
						description="Cuando guardes una peluca con el ♥, aparecerá acá."
						action={
							<Link
								href="/catalogo"
								className="inline-block rounded-xl bg-velajuy-wine px-5 py-2.5 text-sm font-medium text-white"
							>
								Ir al catálogo
							</Link>
						}
					/>
				</div>
			) : (
				<ul className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
					{items.map((p) => (
						<li key={p.id}>
							<ProductCard
								product={{
									id: p.id,
									slug: p.slug,
									name: p.name,
									shortDescription: p.shortDescription,
									priceAmount: p.priceAmount,
									priceCurrency: p.priceCurrency,
									stockQuantity: p.stockQuantity,
									primaryImageUrl: p.primaryImageUrl,
								}}
							/>
						</li>
					))}
				</ul>
			)}
		</main>
	)
}
```

- [ ] **Step 6: Verify end-to-end**

Run: `pnpm db:seed && pnpm dev`
1. Log in as `andre.vital@metalab.com` (magic-link printed in terminal).
2. Visit `/producto/rosa-pastel-50cm` → click "Guardar" → toast "¡Agregada a tu lista!".
3. Visit `/cuenta/wishlist` → 1 card shown.
4. Back on the PDP, click "En tu lista" → toast "Quitada de tu lista". `/cuenta/wishlist` is empty again.
5. Log out (clear cookies). On PDP, click "Guardar" → redirects to `/ingresar?redirect=/producto/rosa-pastel-50cm`.

Ctrl-C.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(wishlist): heart toggle, server actions, account page"
```

---

### Task 13: Back-in-stock — token helper, queries, actions, form

**Files:**
- Create: `src/lib/back-in-stock/token.ts`, `src/lib/back-in-stock/queries.ts`, `src/lib/back-in-stock/actions.ts`
- Create: `src/app/(storefront)/producto/[slug]/back-in-stock-form.tsx`
- Modify: `src/app/(storefront)/producto/[slug]/page.tsx` (pass `backInStockSlot`)

When stock = 0 the PDP shows an email-capture form. On submit, a row in `back_in_stock_subscriptions` with a random `unsubscribe_token`. The actual "back-in-stock" notification batch is Plan 5 (Payments / Emails). Phase 1: store + render success.

- [ ] **Step 1: Token helper**

`src/lib/back-in-stock/token.ts`:

```ts
import { randomBytes } from "node:crypto"

export function newUnsubscribeToken(): string {
	return randomBytes(24).toString("base64url")
}
```

- [ ] **Step 2: Queries**

`src/lib/back-in-stock/queries.ts`:

```ts
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { backInStockSubscriptions } from "@/lib/db/schema"

export async function findByToken(token: string) {
	const [row] = await db
		.select()
		.from(backInStockSubscriptions)
		.where(eq(backInStockSubscriptions.unsubscribeToken, token))
	return row ?? null
}
```

- [ ] **Step 3: Actions**

`src/lib/back-in-stock/actions.ts`:

```ts
"use server"

import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { z } from "zod"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { backInStockSubscriptions } from "@/lib/db/schema"
import { newUnsubscribeToken } from "./token"

const subscribeSchema = z.object({
	productId: z.string().uuid(),
	email: z.email(),
})

export type SubscribeResult = { ok: true } | { ok: false; error: string }

export async function subscribeBackInStock(input: unknown): Promise<SubscribeResult> {
	const parsed = subscribeSchema.safeParse(input)
	if (!parsed.success) {
		return { ok: false, error: "Email inválido" }
	}
	const { productId, email } = parsed.data
	const session = await auth.api.getSession({ headers: await headers() })

	const existing = await db
		.select()
		.from(backInStockSubscriptions)
		.where(
			and(
				eq(backInStockSubscriptions.productId, productId),
				eq(backInStockSubscriptions.email, email),
			),
		)
	if (existing.length > 0) {
		return { ok: true }
	}

	await db.insert(backInStockSubscriptions).values({
		productId,
		email,
		userId: session?.user.id ?? null,
		unsubscribeToken: newUnsubscribeToken(),
	})
	return { ok: true }
}

export async function unsubscribeBackInStock(token: string): Promise<SubscribeResult> {
	if (!token) return { ok: false, error: "Token requerido" }
	const result = await db
		.delete(backInStockSubscriptions)
		.where(eq(backInStockSubscriptions.unsubscribeToken, token))
		.returning({ id: backInStockSubscriptions.id })
	if (result.length === 0) return { ok: false, error: "Suscripción no encontrada" }
	return { ok: true }
}
```

- [ ] **Step 4: Form**

`src/app/(storefront)/producto/[slug]/back-in-stock-form.tsx`:

```tsx
"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { subscribeBackInStock } from "@/lib/back-in-stock/actions"

export function BackInStockForm({
	productId,
	defaultEmail,
}: {
	productId: string
	defaultEmail?: string | null
}) {
	const [email, setEmail] = useState(defaultEmail ?? "")
	const [pending, startTransition] = useTransition()
	const [done, setDone] = useState(false)

	function onSubmit(e: React.FormEvent) {
		e.preventDefault()
		startTransition(async () => {
			const r = await subscribeBackInStock({ productId, email })
			if (!r.ok) {
				toast.error(r.error)
				return
			}
			setDone(true)
			toast.success("Te avisamos cuando vuelva")
		})
	}

	if (done) {
		return (
			<p className="rounded-xl bg-velajuy-pink-soft p-4 text-sm text-velajuy-wine">
				¡Listo! Te enviaremos un correo en cuanto esta peluca vuelva a estar disponible.
			</p>
		)
	}

	return (
		<form onSubmit={onSubmit} className="rounded-xl bg-velajuy-cream p-4">
			<label className="block text-sm font-medium text-velajuy-wine">
				Avísame cuando vuelva
			</label>
			<div className="mt-2 flex gap-2">
				<input
					type="email"
					required
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="tu@correo.com"
					className="flex-1 rounded-lg border border-velajuy-wine/20 bg-white px-3 py-2 text-sm text-velajuy-wine outline-none focus:border-velajuy-wine"
				/>
				<button
					type="submit"
					disabled={pending}
					className="rounded-lg bg-velajuy-wine px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
				>
					{pending ? "Enviando…" : "Avísame"}
				</button>
			</div>
		</form>
	)
}
```

- [ ] **Step 5: PDP passes `backInStockSlot`**

Modify `src/app/(storefront)/producto/[slug]/page.tsx` — add import and slot:

```tsx
import { BackInStockForm } from "./back-in-stock-form"
```

Inside the `ProductInfo` props, replace `backInStockSlot={null}` with:

```tsx
backInStockSlot={
	<BackInStockForm
		productId={product.id}
		defaultEmail={session?.user.email ?? null}
	/>
}
```

- [ ] **Step 6: Verify**

Run: `pnpm dev`
Visit `/producto/rubio-platino-100cm` (stock 0) → "Agotado" badge + back-in-stock form rendered. Submit any email → form replaces with success state, toast appears. Submit again with same email/product → still ok (idempotent). Inspect DB via `pnpm db:studio` → exactly one row in `back_in_stock_subscriptions`. Ctrl-C.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(back-in-stock): subscription form and server actions"
```

---

### Task 14: Back-in-stock unsubscribe page

**Files:**
- Create: `src/app/desuscribir/back-in-stock/page.tsx`

The spec mandates one-click unsubscribe. Phase 1 may not send the actual email yet, but the URL must work today so the wiring is complete when Plan 5 sends real notifications.

- [ ] **Step 1: Unsubscribe page**

`src/app/desuscribir/back-in-stock/page.tsx`:

```tsx
import Link from "next/link"
import { unsubscribeBackInStock } from "@/lib/back-in-stock/actions"

export default async function UnsubscribePage({
	searchParams,
}: {
	searchParams: Promise<{ token?: string }>
}) {
	const { token } = await searchParams
	const result = token ? await unsubscribeBackInStock(token) : { ok: false, error: "Token requerido" }

	return (
		<main className="mx-auto max-w-md px-6 py-24 text-center">
			<h1 className="text-2xl font-bold text-velajuy-wine">Desuscripción</h1>
			{result.ok ? (
				<p className="mt-4 text-velajuy-wine-soft">
					Ya no recibirás correos cuando esta peluca vuelva.
				</p>
			) : (
				<p className="mt-4 text-velajuy-wine-soft">No pudimos procesar tu solicitud: {result.error}.</p>
			)}
			<Link
				href="/"
				className="mt-6 inline-block rounded-xl bg-velajuy-wine px-5 py-2.5 text-sm font-medium text-white"
			>
				Volver a Velajuy
			</Link>
		</main>
	)
}
```

- [ ] **Step 2: Verify**

Run: `pnpm dev`
Visit `/desuscribir/back-in-stock?token=does-not-exist` → "No pudimos procesar tu solicitud: Suscripción no encontrada." Visit a real token (find one with `pnpm db:studio` after subscribing in Task 13) → success message. Ctrl-C.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(back-in-stock): one-click unsubscribe page"
```

---

### Task 15: Playwright E2E — catalog, PDP, wishlist, back-in-stock

**Files:**
- Create: `tests/e2e/catalog.spec.ts`, `tests/e2e/pdp.spec.ts`, `tests/e2e/wishlist.spec.ts`, `tests/e2e/back-in-stock.spec.ts`

The seed inserts predictable products, so tests can assert against fixed slugs/names. Wishlist E2E uses the magic-link sign-in via better-auth's API (no email parsing required — we call `auth.api.signInMagicLink` directly via the storage test setup), OR more simply: hit `/api/auth/magic-link/verify?token=…` after generating one via a direct DB write. Simplest path: seed an additional **test customer** session via the admin owner.

We use the existing seed owner account and just rely on the **dev console magic-link log** parsing isn't needed for Playwright if we instead call better-auth's REST `signIn.magicLink` directly and read the URL from `console.log` output is unreliable. Cleanest approach: insert a session row directly for the seeded owner and set a cookie via `context.addCookies()`. We'll add a small `tests/e2e/helpers/login.ts` that does this.

- [ ] **Step 1: Login helper**

`tests/e2e/helpers/login.ts`:

```ts
import { randomBytes } from "node:crypto"
import postgres from "postgres"
import type { BrowserContext } from "@playwright/test"

const SESSION_DAYS = 7

export async function loginAsOwner(context: BrowserContext, baseURL: string) {
	const sql = postgres(process.env.DATABASE_URL!, { prepare: false })
	try {
		const [owner] = await sql<{ id: string }[]>`
			select id from users where email = 'andre.vital@metalab.com' limit 1
		`
		if (!owner) throw new Error("Owner not seeded — run pnpm db:seed")
		const token = randomBytes(32).toString("base64url")
		const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
		await sql`
			insert into sessions (user_id, token, expires_at)
			values (${owner.id}, ${token}, ${expiresAt})
		`
		const url = new URL(baseURL)
		await context.addCookies([
			{
				name: "better-auth.session_token",
				value: token,
				domain: url.hostname,
				path: "/",
				httpOnly: true,
				secure: url.protocol === "https:",
				sameSite: "Lax",
				expires: Math.floor(expiresAt.getTime() / 1000),
			},
		])
	} finally {
		await sql.end()
	}
}
```

Note: better-auth's actual session cookie name depends on configuration. If `better-auth.session_token` doesn't authenticate, log into the app manually in dev once, copy the cookie name from devtools, and update this constant. better-auth v1.x default is `better-auth.session_token`.

- [ ] **Step 2: Catalog smoke**

`tests/e2e/catalog.spec.ts`:

```ts
import { expect, test } from "@playwright/test"

test("PLP lists seeded products", async ({ page }) => {
	await page.goto("/catalogo")
	await expect(page.getByRole("heading", { name: "Catálogo" })).toBeVisible()
	await expect(page.getByText("Peluca Rosa Pastel 50cm")).toBeVisible()
	await expect(page.getByText("Peluca Bob Negro")).toBeVisible()
})

test("PLP filter by color narrows the grid", async ({ page }) => {
	await page.goto("/catalogo")
	await page.getByLabel(/Rosa pastel/i).check()
	await page.getByRole("button", { name: "Aplicar" }).click()
	await expect(page).toHaveURL(/color=rosa-pastel/)
	await expect(page.getByText("Peluca Rosa Pastel 50cm")).toBeVisible()
	await expect(page.getByText("Peluca Bob Negro")).toHaveCount(0)
})

test("PLP sort by price ascending", async ({ page }) => {
	await page.goto("/catalogo")
	await page.getByLabel("Ordenar:").selectOption("precio-asc")
	await expect(page).toHaveURL(/sort=precio-asc/)
	const firstCard = page.locator("article").first()
	await expect(firstCard).toContainText("Peluca Bob Negro")
})

test("PLP click navigates to PDP", async ({ page }) => {
	await page.goto("/catalogo")
	await page.getByText("Peluca Rosa Pastel 50cm").first().click()
	await expect(page).toHaveURL(/\/producto\/rosa-pastel-50cm/)
})
```

- [ ] **Step 3: PDP smoke**

`tests/e2e/pdp.spec.ts`:

```ts
import { expect, test } from "@playwright/test"

test("PDP renders gallery, info, tabs", async ({ page }) => {
	await page.goto("/producto/rosa-pastel-50cm")
	await expect(page.getByRole("heading", { name: "Peluca Rosa Pastel 50cm" })).toBeVisible()
	await expect(page.getByText("Disponible")).toBeVisible()
	await page.getByRole("button", { name: "Cuidado" }).click()
	await expect(page.getByText(/Lava la peluca/i)).toBeVisible()
	await page.getByRole("button", { name: "Devoluciones" }).click()
	await expect(page.getByText(/no se aceptan devoluciones|no aceptan devoluciones/i)).toBeVisible()
})

test("out-of-stock PDP shows back-in-stock form", async ({ page }) => {
	await page.goto("/producto/rubio-platino-100cm")
	await expect(page.getByText("Agotado")).toBeVisible()
	await expect(page.getByLabel(/Avísame cuando vuelva/i)).toBeVisible()
})

test("unknown slug renders 404", async ({ page }) => {
	const response = await page.goto("/producto/does-not-exist")
	expect(response?.status()).toBe(404)
})
```

- [ ] **Step 4: Wishlist E2E**

`tests/e2e/wishlist.spec.ts`:

```ts
import { expect, test } from "@playwright/test"
import { loginAsOwner } from "./helpers/login"

test("wishlist add → list → remove", async ({ page, context, baseURL }) => {
	await loginAsOwner(context, baseURL!)
	await page.goto("/producto/rosa-pastel-50cm")
	await page.getByRole("button", { name: /Guardar/i }).click()
	await expect(page.getByRole("button", { name: /En tu lista/i })).toBeVisible()
	await page.goto("/cuenta/wishlist")
	await expect(page.getByText("Peluca Rosa Pastel 50cm")).toBeVisible()

	await page.goto("/producto/rosa-pastel-50cm")
	await page.getByRole("button", { name: /En tu lista/i }).click()
	await expect(page.getByRole("button", { name: /Guardar/i })).toBeVisible()
	await page.goto("/cuenta/wishlist")
	await expect(page.getByText("Tu lista está vacía")).toBeVisible()
})

test("logged-out wishlist click redirects to login", async ({ page }) => {
	await page.goto("/producto/rosa-pastel-50cm")
	await page.getByRole("button", { name: /Guardar/i }).click()
	await expect(page).toHaveURL(/\/ingresar\?redirect=/)
})
```

- [ ] **Step 5: Back-in-stock E2E**

`tests/e2e/back-in-stock.spec.ts`:

```ts
import { expect, test } from "@playwright/test"

test("guest subscribes to back-in-stock and sees confirmation", async ({ page }) => {
	await page.goto("/producto/rubio-platino-100cm")
	await page.getByPlaceholder("tu@correo.com").fill(`bis-${Date.now()}@example.com`)
	await page.getByRole("button", { name: /Avísame/i }).click()
	await expect(page.getByText(/Te enviaremos un correo/i)).toBeVisible()
})

test("unsubscribe page handles bad token gracefully", async ({ page }) => {
	await page.goto("/desuscribir/back-in-stock?token=nope")
	await expect(page.getByText(/No pudimos procesar/i)).toBeVisible()
})
```

- [ ] **Step 6: Run all E2E**

Ensure DB is seeded (`pnpm db:seed`), then:

```bash
pnpm test:e2e
```

Expected: 4 existing Plan 1 specs + new specs pass. If wishlist tests fail because the cookie name differs in your better-auth version, run `pnpm dev`, log in manually as the owner, inspect the cookie name in devtools, and update `loginAsOwner()` accordingly.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "test(e2e): catalog, pdp, wishlist, back-in-stock"
```

---

### Task 16: Final verification + PR prep

**Files:**
- None (verification only)

- [ ] **Step 1: Run the full local pipeline**

```bash
cd /Users/andrevital/Documents/work_stuff/av/velajuy
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build
pnpm test:e2e
```

Expected: every step exits 0. If `format:check` fails, run `pnpm format` and recommit.

- [ ] **Step 2: Manual smoke checklist**

Open `pnpm dev`, then in a browser:

- `/catalogo` shows 6 cards.
- Filtering by Color = "Rosa pastel" reduces to 2 cards; URL contains `color=rosa-pastel`.
- "Solo disponibles" hides "Peluca Rubio Platino XL 100cm".
- Sort by "Precio: menor a mayor" puts "Peluca Bob Negro" first.
- Clicking a card opens the quick-view modal at `/producto/<slug>`; closing returns to PLP without scroll jump.
- Direct visit to `/producto/rosa-pastel-50cm` renders the full PDP with tabs and related products.
- `/producto/rubio-platino-100cm` shows "Agotado" + back-in-stock form.
- Submitting an email on the back-in-stock form shows the success state.
- `/desuscribir/back-in-stock?token=<token from DB>` returns success.
- Logged in as the seeded owner, "Guardar" toggles to "En tu lista", `/cuenta/wishlist` lists the product.
- Logged out, "Guardar" redirects to `/ingresar?redirect=/producto/rosa-pastel-50cm`.
- `/ingresar` submits an email; the dev terminal prints `[email/dev] → … Tu enlace para entrar a Velajuy …` with a clickable URL.

If any item fails, stop and fix.

- [ ] **Step 3: Rebase on latest main**

```bash
git fetch origin main
git rebase origin/main
```

Resolve any conflicts. Re-run `pnpm typecheck && pnpm test && pnpm build` after rebasing.

- [ ] **Step 4: Push branch + open PR**

```bash
git push -u origin feat/catalog-discovery
gh pr create --title "feat: catalog, discovery, wishlist, back-in-stock (Phase 2)" --body "$(cat <<'EOF'
## Summary

Phase 2 of Velajuy: public catalog and discovery surface. Builds PLP with filterable/sortable product grid, intercepted-route quick-view modal, PDP with image gallery + tabs + related products, logged-in wishlist, and guest-eligible back-in-stock subscriptions. Also addresses three follow-ups from the Phase 1 review: extracts `requireAdmin()` / `requireSession()` guards, adds `pnpm build` to CI, and wires Resend to `sendMagicLink` (with a console fallback for dev).

## Changes

- **Auth guards** — `src/lib/auth-guards.ts` introduces `requireSession()` and `requireAdmin()`; admin layout and `cuenta` page now delegate to them.
- **Email delivery** — `src/lib/email/{client,templates}/*` wraps Resend. `magicLink.sendMagicLink` sends via Resend when `RESEND_API_KEY` is set; otherwise logs to console. `env.ts` gains optional `RESEND_API_KEY` and `EMAIL_FROM` with a sane default.
- **CI** — `.github/workflows/ci.yml` runs `pnpm build` after unit tests.
- **DB** — `back_in_stock_subscriptions` gains a unique (product_id, email) constraint via `drizzle/0001_*.sql`. `seed.ts` now inserts attributes, attribute values, six sample products with images, and three PDP page rows (`pdp-cuidado`, `pdp-envio`, `pdp-devoluciones`).
- **Catalog** — `src/lib/catalog/{filters,queries}.ts` parses URL filter params and runs the PLP/PDP/related queries. New `/(storefront)/catalogo/{page,filter-sidebar,sort-select}.tsx` render the PLP. Quick-view uses an intercepted route under `@modal/(.)producto/[slug]`.
- **PDP** — `/(storefront)/producto/[slug]/{page,gallery,product-info,product-tabs,related-products,wishlist-button,back-in-stock-form}.tsx`.
- **Wishlist** — `src/lib/wishlist/{queries,actions}.ts` provide server reads/writes. `/cuenta/wishlist/page.tsx` shows the user's saved items.
- **Back-in-stock** — `src/lib/back-in-stock/{token,queries,actions}.ts` + form on out-of-stock PDPs + `/desuscribir/back-in-stock` for one-click unsubscribe.
- **UI primitives** — `Price`, `StockBadge`, `Modal`, `EmptyState`, `ProductCard`. Sonner `<Toaster />` mounted in the root layout.
- **Dependencies** — adds `resend`, `lucide-react`, `sonner`.
- **Tests** — Vitest specs for `slug`, `filters`; Playwright specs for `catalog`, `pdp`, `wishlist`, `back-in-stock`.

## Notable decisions

- **Filter URLs use repeated params, not CSV** — `?color=rosa-pastel&color=lila` is conventional, easy to read in the address bar, and matches Next.js's `useSearchParams().getAll(key)` shape with no parsing layer.
- **Quick-view via intercepted route** — a `@modal/(.)producto/[slug]` route hooks into Next.js's parallel-routes intercept. Internal navigation renders the modal over PLP; direct visits / refresh fall through to the real PDP page, so links remain shareable.
- **No "Más vendidas" sort yet** — sales counts require orders; deferred to Plan 5 (Payments). Sort offers Nuevas + Precio asc/desc as the meaningful subset.
- **Static fallbacks for PDP tabs** — Cuidado/Envío/Devoluciones text lives in the `pages` table (seeded), but the PDP also embeds Spanish fallback strings so the page renders even if seed rows are missing in a fresh environment.
- **Login helper for Playwright writes a session directly** — better-auth magic-link verification via UI requires email parsing, which adds flakiness. The helper inserts a `sessions` row for the seeded owner and sets the cookie — deterministic and fast.
- **Resend has a console fallback** — keeps dev ergonomic (no API key required) and lets Playwright log-reading tests stay valid in CI even before a real Resend key is provisioned.
- **`requireSession()` carries a `returnTo`** — pages can specify their own redirect, and the helper falls back to the `x-pathname` header set by the existing middleware.

## Next steps

- Plan 3 (Admin): product CRUD UI, image upload to R2, order management, settings panel, shipping zone CRUD.
- Plan 4 (Cart & Checkout): cart drawer, checkout page, shipping zone lookup, tax breakdown computation, COD flow.
- Plan 5 (Payments & Emails): Wompi/MP/PayPal integrations, webhook handlers, transactional emails (order placed, payment confirmed, shipped, back-in-stock batched send).
- Decide on the real session cookie name for better-auth in production and update `loginAsOwner()` helper if needed (default expected: `better-auth.session_token`).
EOF
)"
```

- [ ] **Step 5: Tag**

```bash
git tag phase-2-catalog-discovery
git log --oneline -25
```

Phase 2 done. Plan 3 (Admin) is next.

---

## Notes for the implementing engineer

- **Tab indentation, no semicolons, double quotes** — enforced by Prettier. Do not fight the config.
- **Money is always integer minor units + currency code.** Phase 2 reads only; never multiply prices on the client.
- **Filter URLs are the source of truth.** Server Components read `searchParams`; client filter sidebar pushes new URLs. Don't introduce local state that lives outside the URL.
- **Server Actions are the only write path.** Never expose Drizzle queries to client components. If a client component needs to read, prop-drill from a Server Component parent.
- **Intercepted routes** are sensitive to the file layout — `@modal/(.)producto/[slug]/page.tsx` only intercepts when the parent is the route group `(storefront)`. Don't move the directory.
- **Brand colors** still live in `globals.css` `@theme`. Use `bg-velajuy-pink-soft`, `text-velajuy-wine`. No new hex values.
- **All copy is ES-CO** ("tú" form), peso prices via `formatCOP`.
- **`pnpm db:seed` must stay idempotent.** Re-runs only insert rows that don't exist yet; assertions in Playwright depend on a stable count.
- **Commit after every task.** Small commits keep the review surface manageable.
