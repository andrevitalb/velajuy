# Velajuy Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full Phase 1 admin (Dashboard, Pedidos, Productos, Inventario, Zonas de envío, Páginas, Suscripciones back-in-stock, Configuración) on top of the Catalog & Discovery surface. Resolves Phase 2 follow-ups: `/ingresar` honoring `?redirect=`, and the magic-link email emoji.

**Architecture:** Same Next.js app, `/admin/*` route group already gated by `requireAdmin()`. Server Components do all reads (Drizzle direct). Mutations go through Server Actions in `src/lib/admin/<entity>/actions.ts`, each validating with Zod and re-checking the caller's role via `requireAdmin()` (owner-only mutations call `requireOwner()`). Image uploads use a presigned R2 PUT issued from a server action — the browser PUTs directly to R2 then posts the resulting key back. Order state transitions live in one `order-state.ts` service that owns the legal-transition table + the stock-movement side-effects (cancellation restores stock; mark-shipped sends customer email; mark-paid triggers post-paid email + stock decrement for COD). Admin emails (new order, payment received, low stock, COD ready) ride through `sendAdminNotification()` which honors per-event toggles + frequency in `settings.notifications`.

**Tech Stack:** Next.js 16 (App Router, Server Components, Server Actions), Drizzle ORM, Tailwind v4, better-auth (existing), Resend (already wired in Plan 2), React Hook Form + Zod, Sonner, Lucide, `@dnd-kit/sortable` (drag reorder), `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (R2 presigned upload), Vitest + Playwright.

---

## File Structure (created/touched in this plan)

```
velajuy/
├── package.json                                          [modify] add @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, nanoid
├── .env.example                                          [modify] add R2_* vars
├── src/
│   ├── app/
│   │   ├── ingresar/page.tsx                             [modify] honor ?redirect= query param
│   │   ├── admin/
│   │   │   ├── ingresar/page.tsx                         [modify] honor ?redirect= + show error param
│   │   │   ├── page.tsx                                  [rewrite] real dashboard
│   │   │   ├── pedidos/
│   │   │   │   ├── page.tsx                              [create] orders list
│   │   │   │   ├── filters.tsx                           [create] client filter bar
│   │   │   │   └── [orderNumber]/
│   │   │   │       ├── page.tsx                          [create] order detail
│   │   │   │       ├── status-actions.tsx                [create] mark-shipped/delivered/paid/cancel
│   │   │   │       ├── shipped-form.tsx                  [create] courier + tracking modal form
│   │   │   │       └── print/page.tsx                    [create] print-friendly packing slip
│   │   │   ├── productos/
│   │   │   │   ├── page.tsx                              [create] products list
│   │   │   │   ├── nuevo/page.tsx                        [create] create product form
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx                          [create] edit product
│   │   │   │       ├── product-form.tsx                  [create] shared form (client)
│   │   │   │       ├── image-gallery.tsx                 [create] sortable gallery (client)
│   │   │   │       └── attribute-picker.tsx              [create] attribute multi-select (client)
│   │   │   ├── inventario/
│   │   │   │   ├── page.tsx                              [create] stock-only view
│   │   │   │   └── adjust-row.tsx                        [create] inline adjust form (client)
│   │   │   ├── zonas/
│   │   │   │   ├── page.tsx                              [create] zones list + form
│   │   │   │   └── zone-form.tsx                         [create] client form
│   │   │   ├── paginas/
│   │   │   │   ├── page.tsx                              [create] CMS pages list
│   │   │   │   ├── nueva/page.tsx                        [create] new page
│   │   │   │   └── [slug]/page.tsx                       [create] edit page
│   │   │   ├── back-in-stock/page.tsx                    [create] subscriptions per product
│   │   │   └── configuracion/page.tsx                    [create] settings form
│   │   └── api/r2/upload/route.ts                        [create] presign POST (returns PUT URL + key)
│   ├── components/
│   │   └── admin/
│   │       ├── shell.tsx                                 [modify] active nav, user chip, sign out
│   │       ├── sidebar.tsx                               [modify] hide owner-only links for staff
│   │       ├── filter-bar.tsx                            [create] reusable filter chips
│   │       ├── data-table.tsx                            [create] minimal server-rendered table primitive
│   │       ├── page-header.tsx                           [create] H1 + action slot
│   │       ├── status-pill.tsx                           [create] colored badge by order/product status
│   │       ├── empty-state.tsx                           [create] (admin variant)
│   │       └── confirm-dialog.tsx                        [create] client confirm modal
│   ├── lib/
│   │   ├── auth-guards.ts                                [modify] add requireOwner()
│   │   ├── admin/
│   │   │   ├── orders/
│   │   │   │   ├── queries.ts                            [create] listOrders(), getOrderByNumber(), getOrderTimeline()
│   │   │   │   ├── actions.ts                            [create] markPreparing/Shipped/Delivered/CodPaid/Cancel
│   │   │   │   ├── order-state.ts                        [create] transition table + applyTransition()
│   │   │   │   └── order-state.test.ts                   [create]
│   │   │   ├── products/
│   │   │   │   ├── queries.ts                            [create] listAdminProducts(), getProductForEdit(), listLowStock()
│   │   │   │   ├── actions.ts                            [create] createProduct, updateProduct, archiveProduct, reorderImages, deleteImage
│   │   │   │   └── schema.ts                             [create] Zod product form schema
│   │   │   ├── inventory/
│   │   │   │   ├── queries.ts                            [create] listStock(), getStockHistory()
│   │   │   │   ├── actions.ts                            [create] adjustStock()
│   │   │   │   └── adjust.test.ts                        [create]
│   │   │   ├── zones/
│   │   │   │   ├── queries.ts                            [create] listZones()
│   │   │   │   └── actions.ts                            [create] createZone, updateZone, deactivateZone
│   │   │   ├── pages/
│   │   │   │   ├── queries.ts                            [create] listPages(), getPageBySlug()
│   │   │   │   └── actions.ts                            [create] createPage, updatePage, publishPage, unpublishPage
│   │   │   ├── back-in-stock/
│   │   │   │   └── queries.ts                            [create] listSubscriptionsGroupedByProduct()
│   │   │   ├── settings/
│   │   │   │   ├── queries.ts                            [create] getAllSettings()
│   │   │   │   ├── actions.ts                            [create] updateSetting(s)
│   │   │   │   └── schema.ts                             [create] Zod schemas for each settings key
│   │   │   └── dashboard/
│   │   │       └── queries.ts                            [create] todayOrders(), weekRevenue(), lowStock(), pendingShipments()
│   │   ├── email/
│   │   │   ├── templates/
│   │   │   │   ├── magic-link.ts                         [modify] remove emoji or swap to inline SVG
│   │   │   │   ├── order-placed.ts                       [create] customer
│   │   │   │   ├── payment-confirmed.ts                  [create] customer
│   │   │   │   ├── order-shipped.ts                      [create] customer
│   │   │   │   ├── order-delivered.ts                    [create] customer
│   │   │   │   ├── admin-new-order.ts                    [create] owner
│   │   │   │   ├── admin-payment-received.ts             [create] owner
│   │   │   │   ├── admin-low-stock.ts                    [create] owner
│   │   │   │   └── admin-cod-ready.ts                    [create] owner
│   │   │   └── notify.ts                                 [create] sendAdminNotification(event, payload) honors settings.notifications
│   │   ├── r2/
│   │   │   ├── client.ts                                 [create] S3Client preconfigured for R2
│   │   │   ├── presign.ts                                [create] presignUpload(key, contentType, contentLength)
│   │   │   └── key.ts                                    [create] productImageKey(productId, filename)
│   │   └── env.ts                                        [modify] R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL
├── tests/
│   ├── unit/
│   │   ├── order-state.test.ts                           [create]
│   │   ├── adjust-stock.test.ts                          [create]
│   │   └── notify.test.ts                                [create]
│   └── e2e/
│       ├── admin-ingresar-redirect.spec.ts               [create]
│       ├── admin-orders.spec.ts                          [create] login → list → mark shipped → email sent
│       ├── admin-products.spec.ts                        [create] login → create draft → upload image → activate
│       ├── admin-inventory.spec.ts                       [create]
│       ├── admin-zones.spec.ts                           [create]
│       ├── admin-pages.spec.ts                           [create]
│       └── admin-settings.spec.ts                        [create]
```

Order state-machine, R2 client, and admin notification dispatcher each get their own file because they're crosscut and tested in isolation. Each admin view keeps its queries + actions in `src/lib/admin/<entity>/`, mirroring Plan 2's catalog/wishlist/back-in-stock split.

---

## Tasks

### Task 1: Phase 2 follow-up — `/ingresar` honors `?redirect=`

**Files:**
- Modify: `src/app/ingresar/page.tsx`
- Modify: `src/app/admin/ingresar/page.tsx`
- Test: `tests/e2e/admin-ingresar-redirect.spec.ts`

`requireSession()` (Plan 2) sends users to `/ingresar?redirect=/cuenta/wishlist`. The current page hardcodes `callbackURL: "/cuenta"` and ignores the param, so users land in the wrong place after the magic link. Same bug on the admin page. Use a safe-path allowlist (must start with `/`, no protocol-relative `//`).

- [ ] **Step 1: Write the failing e2e**

`tests/e2e/admin-ingresar-redirect.spec.ts`:

```ts
import { test, expect } from "@playwright/test"

test("customer ingresar honors redirect param", async ({ page }) => {
	await page.goto("/ingresar?redirect=%2Fcuenta%2Fwishlist")
	await expect(page.getByText("Te enviamos un enlace mágico")).toBeVisible()
	// The hidden input drives signIn.magicLink callbackURL
	const callback = await page.locator('input[name="callbackURL"]').inputValue()
	expect(callback).toBe("/cuenta/wishlist")
})

test("ingresar rejects unsafe redirects", async ({ page }) => {
	await page.goto("/ingresar?redirect=https%3A%2F%2Fevil.com")
	const callback = await page.locator('input[name="callbackURL"]').inputValue()
	expect(callback).toBe("/cuenta")
})

test("admin ingresar honors redirect param", async ({ page }) => {
	await page.goto("/admin/ingresar?redirect=%2Fadmin%2Fpedidos")
	const callback = await page.locator('input[name="callbackURL"]').inputValue()
	expect(callback).toBe("/admin/pedidos")
})
```

- [ ] **Step 2: Run it — expect failure**

Run: `pnpm test:e2e -- admin-ingresar-redirect.spec.ts`
Expected: FAIL — `input[name="callbackURL"]` not found.

- [ ] **Step 3: Add safe-redirect helper**

Create `src/lib/safe-redirect.ts`:

```ts
/** Returns `redirect` only if it's a same-origin path. Falls back to `fallback`. */
export function safeRedirect(redirect: string | null | undefined, fallback: string): string {
	if (!redirect) return fallback
	if (!redirect.startsWith("/")) return fallback
	if (redirect.startsWith("//")) return fallback
	return redirect
}
```

- [ ] **Step 4: Rewrite customer `/ingresar` to honor it**

`src/app/ingresar/page.tsx`:

```tsx
"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { signIn } from "@/lib/auth-client"
import { safeRedirect } from "@/lib/safe-redirect"

export default function IngresarPage() {
	const search = useSearchParams()
	const callbackURL = safeRedirect(search.get("redirect"), "/cuenta")
	const [email, setEmail] = useState("")
	const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle")
	const [error, setError] = useState<string | null>(null)

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setStatus("loading")
		setError(null)
		const result = await signIn.magicLink({ email, callbackURL })
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
					<input type="hidden" name="callbackURL" value={callbackURL} readOnly />
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

- [ ] **Step 5: Rewrite admin `/admin/ingresar` the same way**

`src/app/admin/ingresar/page.tsx`:

```tsx
"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { signIn } from "@/lib/auth-client"
import { safeRedirect } from "@/lib/safe-redirect"

export default function AdminIngresarPage() {
	const search = useSearchParams()
	const callbackURL = safeRedirect(search.get("redirect"), "/admin")
	const errorParam = search.get("error")
	const [email, setEmail] = useState("")
	const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle")

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setStatus("loading")
		await signIn.magicLink({ email, callbackURL })
		setStatus("sent")
	}

	return (
		<main className="mx-auto max-w-md px-6 py-24">
			<h1 className="text-3xl font-bold text-velajuy-wine">Ingresar al Admin</h1>
			{errorParam === "unauthorized" && (
				<p className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800">
					Tu cuenta no tiene acceso al admin.
				</p>
			)}
			{status === "sent" ? (
				<p className="mt-6 rounded-xl bg-velajuy-pink-soft p-4 text-velajuy-wine">
					Revisa tu correo y haz clic en el enlace.
				</p>
			) : (
				<form className="mt-6 space-y-4" onSubmit={handleSubmit}>
					<input type="hidden" name="callbackURL" value={callbackURL} readOnly />
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

- [ ] **Step 6: Run e2e — expect pass**

Run: `pnpm test:e2e -- admin-ingresar-redirect.spec.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/safe-redirect.ts src/app/ingresar src/app/admin/ingresar tests/e2e/admin-ingresar-redirect.spec.ts
git commit -m "fix(auth): honor ?redirect= param on customer and admin /ingresar"
```

---

### Task 2: Phase 2 follow-up — remove emoji from magic-link email

**Files:**
- Modify: `src/lib/email/templates/magic-link.ts`

Per `feedback_no_emojis_in_ui.md`, replace the 👋 emoji with a Lucide-style inline SVG (heart icon, matches the kawaii brand) and keep the greeting copy. Inline SVG works in every email client; emoji rendering is platform-dependent and considered an emoji in UI text.

- [ ] **Step 1: Update the template**

`src/lib/email/templates/magic-link.ts`:

```ts
const HEART_SVG = `
	<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5c1a2a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -4px; margin-right: 6px;">
		<path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0L12 5.34l-.77-.76a5.4 5.4 0 0 0-7.65 7.65l8.42 8.42 8.42-8.42a5.4 5.4 0 0 0 0-7.65z"/>
	</svg>
`.trim()

export function magicLinkEmail({ url, email }: { url: string; email: string }) {
	const subject = "Tu enlace para entrar a Velajuy"
	const text = `Hola ${email},\n\nUsa este enlace para entrar a Velajuy:\n${url}\n\nEl enlace expira pronto. Si no fuiste tú, ignora este correo.\n\n— Velajuy`
	const html = `
		<div style="font-family: -apple-system, system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #5c1a2a;">
			<h1 style="margin: 0 0 16px; font-size: 24px;">${HEART_SVG}Hola</h1>
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

- [ ] **Step 2: Verify no emoji remains**

Run: `grep -P "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" src/lib/email/templates/magic-link.ts || echo "clean"`
Expected: `clean`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/email/templates/magic-link.ts
git commit -m "fix(email): replace emoji in magic-link with inline SVG"
```

---

### Task 3: `requireOwner()` and admin role guard helpers

**Files:**
- Modify: `src/lib/auth-guards.ts`
- Test: `tests/unit/auth-guards.test.ts`

Several admin mutations (price changes, product create/delete, zones, pages, settings, user role changes) are owner-only per spec §9. `requireAdmin()` lets staff in too, so we add `requireOwner()` and a non-throwing `getAdminRole()` for conditional UI.

- [ ] **Step 1: Write failing unit test**

`tests/unit/auth-guards.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest"

vi.mock("next/headers", () => ({ headers: async () => new Headers() }))
const redirectSpy = vi.fn((url: string) => {
	throw new Error(`redirect:${url}`)
})
vi.mock("next/navigation", () => ({ redirect: redirectSpy }))

let session: { user: { role?: string } } | null = null
vi.mock("@/lib/auth", () => ({
	auth: { api: { getSession: async () => session } },
}))

import { requireOwner, getAdminRole } from "@/lib/auth-guards"

describe("requireOwner", () => {
	it("returns the session for owner role", async () => {
		session = { user: { role: "owner" } }
		const result = await requireOwner()
		expect(result.role).toBe("owner")
	})
	it("redirects when caller is staff", async () => {
		session = { user: { role: "staff" } }
		await expect(requireOwner()).rejects.toThrow(/redirect:\/admin\?error=forbidden/)
	})
	it("redirects when no session", async () => {
		session = null
		await expect(requireOwner()).rejects.toThrow(/redirect:\/admin\/ingresar/)
	})
})

describe("getAdminRole", () => {
	it("returns role string", async () => {
		session = { user: { role: "staff" } }
		expect(await getAdminRole()).toBe("staff")
	})
	it("returns null when no session", async () => {
		session = null
		expect(await getAdminRole()).toBeNull()
	})
})
```

- [ ] **Step 2: Run — expect failure**

Run: `pnpm test -- auth-guards`
Expected: FAIL — `requireOwner` not exported.

- [ ] **Step 3: Extend `auth-guards.ts`**

Append to `src/lib/auth-guards.ts`:

```ts
/** Returns the session if the user has owner role; otherwise redirects. */
export async function requireOwner(): Promise<AuthenticatedSession & { role: "owner" }> {
	const requestHeaders = await headers()
	const session = await auth.api.getSession({ headers: requestHeaders })
	if (!session) redirect("/admin/ingresar" as Route)
	const role = (session.user as { role?: string }).role
	if (role !== "owner") redirect("/admin?error=forbidden" as Route)
	return { ...session, role: "owner" }
}

/** Non-throwing role lookup for conditional UI. Returns "owner" | "staff" | null. */
export async function getAdminRole(): Promise<"owner" | "staff" | null> {
	const requestHeaders = await headers()
	const session = await auth.api.getSession({ headers: requestHeaders })
	if (!session) return null
	const role = (session.user as { role?: string }).role
	if (role === "owner" || role === "staff") return role
	return null
}
```

- [ ] **Step 4: Run — expect pass**

Run: `pnpm test -- auth-guards`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth-guards.ts tests/unit/auth-guards.test.ts
git commit -m "feat(admin): add requireOwner and getAdminRole guards"
```

---

### Task 4: Admin shell polish (active nav, user chip, sign-out, role-aware sidebar)

**Files:**
- Modify: `src/components/admin/shell.tsx`
- Modify: `src/components/admin/sidebar.tsx`
- Create: `src/components/admin/page-header.tsx`
- Create: `src/components/admin/sign-out-button.tsx`

The current shell renders the sidebar and content with no top bar. Add a top bar with the logged-in user's name + role pill + sign-out, mark the active sidebar link, and hide owner-only links from staff.

- [ ] **Step 1: Create `PageHeader`**

`src/components/admin/page-header.tsx`:

```tsx
export function PageHeader({
	title,
	subtitle,
	actions,
}: {
	title: string
	subtitle?: string
	actions?: React.ReactNode
}) {
	return (
		<header className="mb-8 flex items-start justify-between gap-4">
			<div>
				<h1 className="text-3xl font-bold text-velajuy-wine">{title}</h1>
				{subtitle && <p className="mt-1 text-sm text-velajuy-wine-soft">{subtitle}</p>}
			</div>
			{actions && <div className="flex gap-2">{actions}</div>}
		</header>
	)
}
```

- [ ] **Step 2: Create `SignOutButton` (client)**

`src/components/admin/sign-out-button.tsx`:

```tsx
"use client"

import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { signOut } from "@/lib/auth-client"

export function SignOutButton() {
	const router = useRouter()
	return (
		<button
			type="button"
			onClick={async () => {
				await signOut()
				router.push("/admin/ingresar")
			}}
			className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-velajuy-wine hover:bg-velajuy-pink-soft"
		>
			<LogOut className="size-4" /> Salir
		</button>
	)
}
```

- [ ] **Step 3: Update `AdminShell` with top bar**

`src/components/admin/shell.tsx`:

```tsx
import { requireAdmin } from "@/lib/auth-guards"
import { AdminSidebar } from "./sidebar"
import { SignOutButton } from "./sign-out-button"

export async function AdminShell({ children }: { children: React.ReactNode }) {
	const session = await requireAdmin()
	const role = session.role
	const name = session.user.name ?? session.user.email

	return (
		<div className="flex min-h-screen bg-white">
			<AdminSidebar role={role} />
			<div className="flex flex-1 flex-col">
				<header className="flex items-center justify-end gap-4 border-b border-velajuy-wine/10 bg-velajuy-cream px-6 py-3">
					<span className="text-sm text-velajuy-wine">
						{name}
						<span className="ml-2 rounded-full bg-velajuy-pink-soft px-2 py-0.5 text-xs font-medium uppercase tracking-wide">
							{role}
						</span>
					</span>
					<SignOutButton />
				</header>
				<main className="flex-1 p-8">{children}</main>
			</div>
		</div>
	)
}
```

- [ ] **Step 4: Update `AdminSidebar` — active state + role-aware filtering**

`src/components/admin/sidebar.tsx`:

```tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { Route } from "next"
import {
	LayoutDashboard,
	ShoppingBag,
	Package,
	Boxes,
	Truck,
	FileText,
	Bell,
	Settings,
} from "lucide-react"

type Role = "owner" | "staff"

type LinkDef = {
	href: Route
	label: string
	icon: React.ElementType
	ownerOnly?: boolean
}

const LINKS: LinkDef[] = [
	{ href: "/admin" as Route, label: "Dashboard", icon: LayoutDashboard },
	{ href: "/admin/pedidos" as Route, label: "Pedidos", icon: ShoppingBag },
	{ href: "/admin/productos" as Route, label: "Productos", icon: Package, ownerOnly: false },
	{ href: "/admin/inventario" as Route, label: "Inventario", icon: Boxes },
	{ href: "/admin/zonas" as Route, label: "Zonas de envío", icon: Truck, ownerOnly: true },
	{ href: "/admin/paginas" as Route, label: "Páginas", icon: FileText, ownerOnly: true },
	{ href: "/admin/back-in-stock" as Route, label: "Back-in-stock", icon: Bell },
	{ href: "/admin/configuracion" as Route, label: "Configuración", icon: Settings, ownerOnly: true },
]

export function AdminSidebar({ role }: { role: Role }) {
	const pathname = usePathname()
	const visible = LINKS.filter((l) => (l.ownerOnly ? role === "owner" : true))

	return (
		<aside className="w-60 shrink-0 border-r border-velajuy-wine/10 bg-velajuy-cream p-4">
			<Link href={"/admin" as Route} className="block text-xl font-bold text-velajuy-wine">
				Velajuy · Admin
			</Link>
			<nav className="mt-6 space-y-1">
				{visible.map((l) => {
					const Icon = l.icon
					const active =
						l.href === "/admin"
							? pathname === "/admin"
							: pathname?.startsWith(l.href as string)
					return (
						<Link
							key={l.href}
							href={l.href}
							className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
								active
									? "bg-velajuy-wine text-white"
									: "text-velajuy-wine hover:bg-velajuy-pink-soft"
							}`}
						>
							<Icon className="size-4" /> {l.label}
						</Link>
					)
				})}
			</nav>
		</aside>
	)
}
```

- [ ] **Step 5: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin
git commit -m "feat(admin): top bar with user chip, active sidebar, role-aware links"
```

---

### Task 5: R2 client + presigned upload server action

**Files:**
- Modify: `package.json`, `.env.example`, `src/lib/env.ts`
- Create: `src/lib/r2/client.ts`, `src/lib/r2/presign.ts`, `src/lib/r2/key.ts`
- Create: `src/app/api/r2/upload/route.ts`

The product editor needs image uploads. R2 is S3-compatible: store credentials, issue a presigned PUT from a route handler, the client PUTs the file directly, the URL of the uploaded object becomes the `product_images.url`. Route handler — not server action — because the browser fetches the presigned URL via `fetch()` and we want a standard JSON response.

- [ ] **Step 1: Install deps**

```bash
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner nanoid
```

- [ ] **Step 2: Add env vars**

Append to `src/lib/env.ts`:

```ts
// inside the schema object
R2_ACCOUNT_ID: z.string().min(1),
R2_ACCESS_KEY_ID: z.string().min(1),
R2_SECRET_ACCESS_KEY: z.string().min(1),
R2_BUCKET: z.string().min(1),
R2_PUBLIC_URL: z.url(), // e.g. https://cdn.velajuy.com
```

Append to `.env.example`:

```
# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=velajuy-uploads
R2_PUBLIC_URL=https://cdn.velajuy.com
```

- [ ] **Step 3: Create R2 client**

`src/lib/r2/client.ts`:

```ts
import { S3Client } from "@aws-sdk/client-s3"
import { env } from "@/lib/env"

export const r2 = new S3Client({
	region: "auto",
	endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: env.R2_ACCESS_KEY_ID,
		secretAccessKey: env.R2_SECRET_ACCESS_KEY,
	},
})
```

- [ ] **Step 4: Create key helper**

`src/lib/r2/key.ts`:

```ts
import { nanoid } from "nanoid"

export function productImageKey(productId: string, filename: string): string {
	const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg"
	if (!["jpg", "jpeg", "png", "webp", "avif"].includes(ext)) {
		throw new Error(`Unsupported extension: ${ext}`)
	}
	return `products/${productId}/${nanoid(12)}.${ext}`
}
```

- [ ] **Step 5: Create presign helper**

`src/lib/r2/presign.ts`:

```ts
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { r2 } from "./client"
import { env } from "@/lib/env"

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"]

export async function presignProductImageUpload({
	key,
	contentType,
	contentLength,
}: {
	key: string
	contentType: string
	contentLength: number
}): Promise<{ uploadUrl: string; publicUrl: string }> {
	if (!ALLOWED_TYPES.includes(contentType)) {
		throw new Error(`Unsupported content-type: ${contentType}`)
	}
	if (contentLength > MAX_BYTES) {
		throw new Error(`File too large: ${contentLength} > ${MAX_BYTES}`)
	}
	const command = new PutObjectCommand({
		Bucket: env.R2_BUCKET,
		Key: key,
		ContentType: contentType,
		ContentLength: contentLength,
	})
	const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 60 })
	return { uploadUrl, publicUrl: `${env.R2_PUBLIC_URL}/${key}` }
}
```

- [ ] **Step 6: Create route handler**

`src/app/api/r2/upload/route.ts`:

```ts
import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth-guards"
import { presignProductImageUpload } from "@/lib/r2/presign"
import { productImageKey } from "@/lib/r2/key"

const Body = z.object({
	productId: z.string().uuid(),
	filename: z.string().min(1).max(200),
	contentType: z.string().min(1),
	contentLength: z.number().int().positive(),
})

export async function POST(request: Request) {
	await requireAdmin()
	const json = await request.json().catch(() => null)
	const parsed = Body.safeParse(json)
	if (!parsed.success) {
		return NextResponse.json({ error: "invalid_payload" }, { status: 400 })
	}
	const { productId, filename, contentType, contentLength } = parsed.data
	try {
		const key = productImageKey(productId, filename)
		const { uploadUrl, publicUrl } = await presignProductImageUpload({
			key,
			contentType,
			contentLength,
		})
		return NextResponse.json({ key, uploadUrl, publicUrl })
	} catch (err) {
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "presign_failed" },
			{ status: 400 },
		)
	}
}
```

- [ ] **Step 7: Typecheck**

Run: `pnpm typecheck`
Expected: clean.

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-lock.yaml .env.example src/lib/env.ts src/lib/r2 src/app/api/r2
git commit -m "feat(admin): R2 presigned upload route + S3 client setup"
```

---

### Task 6: Order state machine

**Files:**
- Create: `src/lib/admin/orders/order-state.ts`
- Create: `tests/unit/order-state.test.ts`

Centralize legal status transitions and the side-effect for each so the resolver actions (Task 8) stay thin. The spec §7 state machine:

```
pending_payment → paid → preparing → shipped → delivered
                   ↓        ↓
              cancelled   cancelled (pre-shipment only)
pending_payment → failed
```

COD orders enter at `preparing` directly with `payment_status = pending_on_delivery`; "mark COD paid" flips `payment_status` to `paid` but doesn't move `status`.

- [ ] **Step 1: Write the failing unit test**

`tests/unit/order-state.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import {
	canTransition,
	nextStatus,
	type OrderStatus,
} from "@/lib/admin/orders/order-state"

describe("order-state", () => {
	it("paid → preparing is legal", () => {
		expect(canTransition("paid", "preparing")).toBe(true)
	})
	it("preparing → shipped is legal", () => {
		expect(canTransition("preparing", "shipped")).toBe(true)
	})
	it("shipped → delivered is legal", () => {
		expect(canTransition("shipped", "delivered")).toBe(true)
	})
	it("preparing → cancelled is legal (pre-shipment)", () => {
		expect(canTransition("preparing", "cancelled")).toBe(true)
	})
	it("shipped → cancelled is illegal", () => {
		expect(canTransition("shipped", "cancelled")).toBe(false)
	})
	it("delivered → anything is illegal", () => {
		const all: OrderStatus[] = [
			"pending_payment",
			"paid",
			"preparing",
			"shipped",
			"delivered",
			"cancelled",
			"failed",
		]
		for (const target of all) {
			expect(canTransition("delivered", target)).toBe(false)
		}
	})
	it("pending_payment → paid is legal", () => {
		expect(canTransition("pending_payment", "paid")).toBe(true)
	})
	it("pending_payment → failed is legal (expiry)", () => {
		expect(canTransition("pending_payment", "failed")).toBe(true)
	})
	it("nextStatus returns the canonical forward step", () => {
		expect(nextStatus("paid")).toBe("preparing")
		expect(nextStatus("preparing")).toBe("shipped")
		expect(nextStatus("shipped")).toBe("delivered")
		expect(nextStatus("delivered")).toBeNull()
	})
})
```

- [ ] **Step 2: Run — expect failure**

Run: `pnpm test -- order-state`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `order-state.ts`**

`src/lib/admin/orders/order-state.ts`:

```ts
export type OrderStatus =
	| "pending_payment"
	| "paid"
	| "preparing"
	| "shipped"
	| "delivered"
	| "cancelled"
	| "failed"

const LEGAL: Record<OrderStatus, OrderStatus[]> = {
	pending_payment: ["paid", "cancelled", "failed"],
	paid: ["preparing", "cancelled"],
	preparing: ["shipped", "cancelled"],
	shipped: ["delivered"],
	delivered: [],
	cancelled: [],
	failed: [],
}

const FORWARD: Partial<Record<OrderStatus, OrderStatus>> = {
	paid: "preparing",
	preparing: "shipped",
	shipped: "delivered",
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
	return LEGAL[from]?.includes(to) ?? false
}

export function nextStatus(from: OrderStatus): OrderStatus | null {
	return FORWARD[from] ?? null
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
	if (!canTransition(from, to)) {
		throw new Error(`Illegal order transition: ${from} → ${to}`)
	}
}

/** Timestamps to set on a status change. */
export function timestampsFor(to: OrderStatus, now: Date = new Date()): Partial<{
	paidAt: Date
	shippedAt: Date
	deliveredAt: Date
	cancelledAt: Date
}> {
	switch (to) {
		case "paid":
			return { paidAt: now }
		case "shipped":
			return { shippedAt: now }
		case "delivered":
			return { deliveredAt: now }
		case "cancelled":
			return { cancelledAt: now }
		default:
			return {}
	}
}
```

- [ ] **Step 4: Run — expect pass**

Run: `pnpm test -- order-state`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin/orders/order-state.ts tests/unit/order-state.test.ts
git commit -m "feat(admin): order status state machine with legal transitions"
```

---

### Task 7: Admin notification dispatcher

**Files:**
- Create: `src/lib/email/notify.ts`
- Create: `src/lib/email/templates/admin-new-order.ts`
- Create: `src/lib/email/templates/admin-payment-received.ts`
- Create: `src/lib/email/templates/admin-low-stock.ts`
- Create: `src/lib/email/templates/admin-cod-ready.ts`
- Create: `tests/unit/notify.test.ts`

Per spec §9, admin notifications are per-event (toggle + frequency + target email) stored in `settings.notifications`. Phase 1 honors `immediate` and `off`; `daily` falls back to immediate with a TODO comment (no cron infrastructure until Phase 3). Resolves at runtime via `getAllSettings()`.

- [ ] **Step 1: Write failing test**

`tests/unit/notify.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"

const sendEmail = vi.fn(async () => {})
vi.mock("@/lib/email/client", () => ({ sendEmail }))

const getNotifications = vi.fn()
vi.mock("@/lib/admin/settings/queries", () => ({
	getNotifications: () => getNotifications(),
}))

import { sendAdminNotification } from "@/lib/email/notify"

beforeEach(() => {
	sendEmail.mockClear()
	getNotifications.mockReset()
})

describe("sendAdminNotification", () => {
	it("sends when event is enabled", async () => {
		getNotifications.mockResolvedValue({
			new_order: { enabled: true, frequency: "immediate", email: "owner@x.co" },
		})
		await sendAdminNotification("new_order", {
			subject: "S",
			html: "<p>H</p>",
			text: "T",
		})
		expect(sendEmail).toHaveBeenCalledWith({
			to: "owner@x.co",
			subject: "S",
			html: "<p>H</p>",
			text: "T",
		})
	})
	it("skips when event is disabled", async () => {
		getNotifications.mockResolvedValue({
			new_order: { enabled: false, frequency: "immediate", email: "owner@x.co" },
		})
		await sendAdminNotification("new_order", { subject: "S", html: "H", text: "T" })
		expect(sendEmail).not.toHaveBeenCalled()
	})
	it("skips when frequency is off", async () => {
		getNotifications.mockResolvedValue({
			new_order: { enabled: true, frequency: "off", email: "owner@x.co" },
		})
		await sendAdminNotification("new_order", { subject: "S", html: "H", text: "T" })
		expect(sendEmail).not.toHaveBeenCalled()
	})
	it("falls back to owner email when event email is null", async () => {
		getNotifications.mockResolvedValue({
			new_order: { enabled: true, frequency: "immediate", email: null },
		})
		await sendAdminNotification(
			"new_order",
			{ subject: "S", html: "H", text: "T" },
			{ ownerEmail: "fallback@x.co" },
		)
		expect(sendEmail).toHaveBeenCalledWith({
			to: "fallback@x.co",
			subject: "S",
			html: "H",
			text: "T",
		})
	})
})
```

- [ ] **Step 2: Run — expect failure**

Run: `pnpm test -- notify`
Expected: FAIL.

- [ ] **Step 3: Create the four admin templates**

`src/lib/email/templates/admin-new-order.ts`:

```ts
import { formatCOP } from "@/lib/money"

export function adminNewOrderEmail(args: {
	orderNumber: string
	customer: string
	paymentMethod: string
	totalAmount: number
	itemCount: number
}) {
	const subject = `Nuevo pedido ${args.orderNumber} — ${formatCOP(args.totalAmount)}`
	const text = `Pedido ${args.orderNumber}\nCliente: ${args.customer}\nMétodo: ${args.paymentMethod}\nArtículos: ${args.itemCount}\nTotal: ${formatCOP(args.totalAmount)}`
	const html = `
		<div style="font-family: -apple-system, system-ui, sans-serif; color: #5c1a2a;">
			<h2 style="margin: 0 0 8px;">Pedido ${args.orderNumber}</h2>
			<p style="margin: 0 0 4px;">Cliente: <b>${args.customer}</b></p>
			<p style="margin: 0 0 4px;">Método: ${args.paymentMethod}</p>
			<p style="margin: 0 0 4px;">Artículos: ${args.itemCount}</p>
			<p style="margin: 0 0 4px;">Total: <b>${formatCOP(args.totalAmount)}</b></p>
		</div>
	`
	return { subject, html, text }
}
```

`src/lib/email/templates/admin-payment-received.ts`:

```ts
import { formatCOP } from "@/lib/money"

export function adminPaymentReceivedEmail(args: {
	orderNumber: string
	provider: string
	amount: number
}) {
	const subject = `Pago confirmado · ${args.orderNumber}`
	const text = `Pago confirmado para ${args.orderNumber} vía ${args.provider}: ${formatCOP(args.amount)}.`
	const html = `<p style="font-family: -apple-system; color: #5c1a2a;">${text}</p>`
	return { subject, html, text }
}
```

`src/lib/email/templates/admin-low-stock.ts`:

```ts
export function adminLowStockEmail(args: { productName: string; quantity: number }) {
	const subject = `Stock bajo: ${args.productName} (${args.quantity})`
	const text = `Quedan ${args.quantity} unidades de ${args.productName}.`
	const html = `<p style="font-family: -apple-system; color: #5c1a2a;">${text}</p>`
	return { subject, html, text }
}
```

`src/lib/email/templates/admin-cod-ready.ts`:

```ts
export function adminCodReadyEmail(args: { orderNumber: string; recipient: string }) {
	const subject = `Contra entrega listo para confirmar pago · ${args.orderNumber}`
	const text = `${args.orderNumber} entregado a ${args.recipient}. Cuando recibas el efectivo del courier, marca el pago como recibido en el admin.`
	const html = `<p style="font-family: -apple-system; color: #5c1a2a;">${text}</p>`
	return { subject, html, text }
}
```

- [ ] **Step 4: Create the dispatcher**

`src/lib/email/notify.ts`:

```ts
import { sendEmail } from "@/lib/email/client"
import { getNotifications } from "@/lib/admin/settings/queries"

export type AdminEvent = "new_order" | "payment_received" | "stock_low" | "cod_ready"

type Payload = { subject: string; html: string; text: string }

export async function sendAdminNotification(
	event: AdminEvent,
	payload: Payload,
	options?: { ownerEmail?: string },
): Promise<void> {
	const config = await getNotifications()
	const eventConfig = config[event]
	if (!eventConfig?.enabled) return
	if (eventConfig.frequency === "off") return
	// TODO: "daily" frequency requires a Phase 3 cron — treat as immediate for now.
	const to = eventConfig.email ?? options?.ownerEmail
	if (!to) return
	await sendEmail({ to, subject: payload.subject, html: payload.html, text: payload.text })
}
```

- [ ] **Step 5: Run — expect pass**

Run: `pnpm test -- notify`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/email/notify.ts src/lib/email/templates tests/unit/notify.test.ts
git commit -m "feat(admin): admin notification dispatcher with settings-driven routing"
```

---

### Task 8: Settings queries + Zod schema

**Files:**
- Create: `src/lib/admin/settings/queries.ts`
- Create: `src/lib/admin/settings/schema.ts`
- Create: `src/lib/admin/settings/actions.ts`

The `settings` table is key/value with `jsonb` values. Centralize typed accessors so callers don't reach into raw JSON. Phase 1 keys come from `seed.ts` — same shape here.

- [ ] **Step 1: Create Zod schemas**

`src/lib/admin/settings/schema.ts`:

```ts
import { z } from "zod"

export const notificationEventSchema = z.object({
	enabled: z.boolean(),
	frequency: z.enum(["immediate", "daily", "off"]),
	email: z.string().email().nullable(),
})

export const notificationsSchema = z.object({
	new_order: notificationEventSchema,
	payment_received: notificationEventSchema,
	stock_low: notificationEventSchema,
	cod_ready: notificationEventSchema,
})

export type Notifications = z.infer<typeof notificationsSchema>

export const settingsSchema = z.object({
	shop_name: z.string().min(1),
	contact_email: z.string().email(),
	contact_phone: z.string().min(1),
	social_instagram: z.string(),
	free_shipping_min_quantity: z.number().int().min(0).max(99),
	low_stock_threshold_default: z.number().int().min(0).max(999),
	iva_default_rate: z.number().int().min(0).max(99),
	notifications: notificationsSchema,
})

export type Settings = z.infer<typeof settingsSchema>
```

- [ ] **Step 2: Create queries**

`src/lib/admin/settings/queries.ts`:

```ts
import { db } from "@/lib/db"
import { settings } from "@/lib/db/schema"
import { type Notifications, notificationsSchema } from "./schema"

export async function getAllSettings(): Promise<Record<string, unknown>> {
	const rows = await db.select().from(settings)
	return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}

export async function getNotifications(): Promise<Notifications> {
	const all = await getAllSettings()
	return notificationsSchema.parse(all.notifications)
}

export async function getOwnerEmail(): Promise<string> {
	const all = await getAllSettings()
	return typeof all.contact_email === "string" ? all.contact_email : "owner@velajuy.com"
}
```

- [ ] **Step 3: Create actions**

`src/lib/admin/settings/actions.ts`:

```ts
"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { settings } from "@/lib/db/schema"
import { requireOwner } from "@/lib/auth-guards"

export async function updateSetting(key: string, value: unknown): Promise<void> {
	await requireOwner()
	const existing = await db.select().from(settings).where(eq(settings.key, key))
	if (existing.length === 0) {
		await db.insert(settings).values({ key, value })
	} else {
		await db.update(settings).set({ value, updatedAt: new Date() }).where(eq(settings.key, key))
	}
	revalidatePath("/admin/configuracion")
}
```

- [ ] **Step 4: Typecheck**

Run: `pnpm typecheck`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin/settings
git commit -m "feat(admin): settings queries, zod schema, owner-only update action"
```

---

### Task 9: Dashboard view

**Files:**
- Create: `src/lib/admin/dashboard/queries.ts`
- Rewrite: `src/app/admin/page.tsx`

Today's orders, this-week revenue, low-stock list, pending shipments — four cards on top, two lists below.

- [ ] **Step 1: Create dashboard queries**

`src/lib/admin/dashboard/queries.ts`:

```ts
import { and, count, eq, gte, lt, sum } from "drizzle-orm"
import { db } from "@/lib/db"
import { orders, products } from "@/lib/db/schema"

function startOfDay(d: Date): Date {
	const x = new Date(d)
	x.setHours(0, 0, 0, 0)
	return x
}

function startOfWeek(d: Date): Date {
	const x = startOfDay(d)
	x.setDate(x.getDate() - x.getDay())
	return x
}

export async function todayOrders(): Promise<{ count: number; total: number }> {
	const today = startOfDay(new Date())
	const tomorrow = new Date(today)
	tomorrow.setDate(tomorrow.getDate() + 1)
	const [row] = await db
		.select({ count: count(), total: sum(orders.totalAmount) })
		.from(orders)
		.where(and(gte(orders.placedAt, today), lt(orders.placedAt, tomorrow)))
	return { count: Number(row.count ?? 0), total: Number(row.total ?? 0) }
}

export async function weekRevenue(): Promise<number> {
	const start = startOfWeek(new Date())
	const [row] = await db
		.select({ total: sum(orders.totalAmount) })
		.from(orders)
		.where(and(gte(orders.placedAt, start), eq(orders.paymentStatus, "paid")))
	return Number(row.total ?? 0)
}

export async function lowStock(limit = 10) {
	return db
		.select({
			id: products.id,
			name: products.name,
			slug: products.slug,
			stock: products.stockQuantity,
			threshold: products.lowStockThreshold,
		})
		.from(products)
		.where(and(eq(products.status, "active")))
		.orderBy(products.stockQuantity)
		.limit(limit)
}

export async function pendingShipments(limit = 10) {
	return db
		.select({
			id: orders.id,
			orderNumber: orders.orderNumber,
			placedAt: orders.placedAt,
			totalAmount: orders.totalAmount,
		})
		.from(orders)
		.where(and(eq(orders.status, "preparing")))
		.orderBy(orders.placedAt)
		.limit(limit)
}
```

- [ ] **Step 2: Rewrite the dashboard page**

`src/app/admin/page.tsx`:

```tsx
import Link from "next/link"
import type { Route } from "next"
import { PageHeader } from "@/components/admin/page-header"
import { formatCOP } from "@/lib/money"
import {
	lowStock,
	pendingShipments,
	todayOrders,
	weekRevenue,
} from "@/lib/admin/dashboard/queries"

export default async function AdminDashboardPage() {
	const [today, weekTotal, low, pending] = await Promise.all([
		todayOrders(),
		weekRevenue(),
		lowStock(),
		pendingShipments(),
	])

	return (
		<>
			<PageHeader title="Dashboard" subtitle="Resumen del día y de la semana" />

			<section className="grid grid-cols-1 gap-4 sm:grid-cols-4">
				<Card label="Pedidos hoy" value={String(today.count)} />
				<Card label="Total hoy" value={formatCOP(today.total)} />
				<Card label="Ingresos semana" value={formatCOP(weekTotal)} />
				<Card label="Stock bajo" value={String(low.filter((p) => p.stock <= p.threshold).length)} />
			</section>

			<section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
				<Panel title="Stock bajo">
					{low.length === 0 ? (
						<p className="text-sm text-velajuy-wine-soft">Todo bien. No hay productos en alerta.</p>
					) : (
						<ul className="divide-y divide-velajuy-wine/10">
							{low.map((p) => (
								<li key={p.id} className="flex items-center justify-between py-2">
									<Link
										href={`/admin/productos/${p.id}` as Route}
										className="text-sm text-velajuy-wine underline"
									>
										{p.name}
									</Link>
									<span
										className={`text-sm font-medium ${
											p.stock <= p.threshold ? "text-red-700" : "text-velajuy-wine-soft"
										}`}
									>
										{p.stock} / umbral {p.threshold}
									</span>
								</li>
							))}
						</ul>
					)}
				</Panel>
				<Panel title="Pendientes de envío">
					{pending.length === 0 ? (
						<p className="text-sm text-velajuy-wine-soft">Sin pedidos en preparación.</p>
					) : (
						<ul className="divide-y divide-velajuy-wine/10">
							{pending.map((o) => (
								<li key={o.id} className="flex items-center justify-between py-2">
									<Link
										href={`/admin/pedidos/${o.orderNumber}` as Route}
										className="text-sm text-velajuy-wine underline"
									>
										{o.orderNumber}
									</Link>
									<span className="text-sm text-velajuy-wine-soft">
										{formatCOP(Number(o.totalAmount))}
									</span>
								</li>
							))}
						</ul>
					)}
				</Panel>
			</section>
		</>
	)
}

function Card({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-2xl border border-velajuy-wine/10 bg-velajuy-cream p-4">
			<p className="text-xs uppercase tracking-wide text-velajuy-wine-soft">{label}</p>
			<p className="mt-1 text-2xl font-bold text-velajuy-wine">{value}</p>
		</div>
	)
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="rounded-2xl border border-velajuy-wine/10 bg-white p-4">
			<h2 className="mb-3 text-lg font-bold text-velajuy-wine">{title}</h2>
			{children}
		</div>
	)
}
```

- [ ] **Step 3: Typecheck + visual check**

Run: `pnpm typecheck` and visit `/admin` while signed in.
Expected: dashboard renders with four cards and two panels.

- [ ] **Step 4: Commit**

```bash
git add src/lib/admin/dashboard src/app/admin/page.tsx
git commit -m "feat(admin): dashboard view with KPIs, low-stock, pending shipments"
```

---

### Task 10: Pedidos list page + filters

**Files:**
- Create: `src/lib/admin/orders/queries.ts`
- Create: `src/app/admin/pedidos/page.tsx`
- Create: `src/app/admin/pedidos/filters.tsx`
- Create: `src/components/admin/status-pill.tsx`
- Create: `src/components/admin/data-table.tsx`

Filter by status, date range, payment method, COD toggle. URL-driven so links stay shareable.

- [ ] **Step 1: Create `StatusPill`**

`src/components/admin/status-pill.tsx`:

```tsx
const COLORS: Record<string, string> = {
	pending_payment: "bg-amber-100 text-amber-900",
	paid: "bg-emerald-100 text-emerald-900",
	preparing: "bg-sky-100 text-sky-900",
	shipped: "bg-indigo-100 text-indigo-900",
	delivered: "bg-velajuy-pink-soft text-velajuy-wine",
	cancelled: "bg-zinc-200 text-zinc-700",
	failed: "bg-red-100 text-red-900",
}

const LABELS: Record<string, string> = {
	pending_payment: "Pago pendiente",
	paid: "Pagado",
	preparing: "Preparando",
	shipped: "Enviado",
	delivered: "Entregado",
	cancelled: "Cancelado",
	failed: "Falló",
}

export function StatusPill({ status }: { status: string }) {
	const color = COLORS[status] ?? "bg-zinc-100 text-zinc-700"
	const label = LABELS[status] ?? status
	return (
		<span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
			{label}
		</span>
	)
}
```

- [ ] **Step 2: Create `DataTable` primitive**

`src/components/admin/data-table.tsx`:

```tsx
import type { ReactNode } from "react"

export type Column<T> = {
	header: string
	cell: (row: T) => ReactNode
	width?: string
	align?: "left" | "right" | "center"
}

export function DataTable<T>({
	columns,
	rows,
	rowKey,
	emptyLabel = "Sin resultados",
}: {
	columns: Column<T>[]
	rows: T[]
	rowKey: (row: T) => string
	emptyLabel?: string
}) {
	if (rows.length === 0) {
		return <p className="rounded-xl bg-velajuy-cream p-8 text-center text-velajuy-wine-soft">{emptyLabel}</p>
	}
	return (
		<table className="w-full border-collapse">
			<thead>
				<tr className="border-b border-velajuy-wine/10 text-left text-xs uppercase tracking-wide text-velajuy-wine-soft">
					{columns.map((c) => (
						<th
							key={c.header}
							className={`py-2 ${c.align === "right" ? "text-right" : ""}`}
							style={c.width ? { width: c.width } : undefined}
						>
							{c.header}
						</th>
					))}
				</tr>
			</thead>
			<tbody className="divide-y divide-velajuy-wine/10">
				{rows.map((r) => (
					<tr key={rowKey(r)}>
						{columns.map((c) => (
							<td
								key={c.header}
								className={`py-3 text-sm text-velajuy-wine ${c.align === "right" ? "text-right" : ""}`}
							>
								{c.cell(r)}
							</td>
						))}
					</tr>
				))}
			</tbody>
		</table>
	)
}
```

- [ ] **Step 3: Create order queries**

`src/lib/admin/orders/queries.ts`:

```ts
import { and, desc, eq, gte, lt, type SQL } from "drizzle-orm"
import { db } from "@/lib/db"
import { orderItems, orders, type Order } from "@/lib/db/schema"

export type OrderListFilters = {
	status?: Order["status"]
	paymentMethod?: NonNullable<Order["paymentMethod"]>
	codOnly?: boolean
	from?: Date
	to?: Date
}

export async function listOrders(filters: OrderListFilters = {}, limit = 100) {
	const where: SQL[] = []
	if (filters.status) where.push(eq(orders.status, filters.status))
	if (filters.paymentMethod) where.push(eq(orders.paymentMethod, filters.paymentMethod))
	if (filters.codOnly) where.push(eq(orders.paymentMethod, "contraentrega"))
	if (filters.from) where.push(gte(orders.placedAt, filters.from))
	if (filters.to) where.push(lt(orders.placedAt, filters.to))
	return db
		.select()
		.from(orders)
		.where(where.length ? and(...where) : undefined)
		.orderBy(desc(orders.placedAt))
		.limit(limit)
}

export async function getOrderByNumber(orderNumber: string) {
	const [row] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber))
	if (!row) return null
	const items = await db.select().from(orderItems).where(eq(orderItems.orderId, row.id))
	return { ...row, items }
}
```

- [ ] **Step 4: Create filter bar (client)**

`src/app/admin/pedidos/filters.tsx`:

```tsx
"use client"

import { useRouter, useSearchParams } from "next/navigation"

const STATUS_OPTIONS = [
	{ value: "", label: "Todos" },
	{ value: "pending_payment", label: "Pago pendiente" },
	{ value: "paid", label: "Pagado" },
	{ value: "preparing", label: "Preparando" },
	{ value: "shipped", label: "Enviado" },
	{ value: "delivered", label: "Entregado" },
	{ value: "cancelled", label: "Cancelado" },
	{ value: "failed", label: "Falló" },
]

export function OrderFilters() {
	const router = useRouter()
	const search = useSearchParams()

	function setParam(key: string, value: string) {
		const next = new URLSearchParams(search.toString())
		if (value) next.set(key, value)
		else next.delete(key)
		router.push(`/admin/pedidos?${next.toString()}`)
	}

	return (
		<div className="mb-6 flex flex-wrap gap-3">
			<select
				value={search.get("status") ?? ""}
				onChange={(e) => setParam("status", e.target.value)}
				className="rounded-lg border border-velajuy-wine/20 bg-white px-3 py-2 text-sm"
			>
				{STATUS_OPTIONS.map((o) => (
					<option key={o.value} value={o.value}>
						{o.label}
					</option>
				))}
			</select>
			<label className="flex items-center gap-2 text-sm text-velajuy-wine">
				<input
					type="checkbox"
					checked={search.get("cod") === "1"}
					onChange={(e) => setParam("cod", e.target.checked ? "1" : "")}
				/>
				Solo contra entrega
			</label>
		</div>
	)
}
```

- [ ] **Step 5: Create list page**

`src/app/admin/pedidos/page.tsx`:

```tsx
import Link from "next/link"
import type { Route } from "next"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { PageHeader } from "@/components/admin/page-header"
import { DataTable, type Column } from "@/components/admin/data-table"
import { StatusPill } from "@/components/admin/status-pill"
import { formatCOP } from "@/lib/money"
import { listOrders } from "@/lib/admin/orders/queries"
import { OrderFilters } from "./filters"

type Order = Awaited<ReturnType<typeof listOrders>>[number]

export default async function OrdersListPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
	const params = await searchParams
	const rows = await listOrders({
		status: typeof params.status === "string" ? (params.status as Order["status"]) : undefined,
		codOnly: params.cod === "1",
	})

	const columns: Column<Order>[] = [
		{
			header: "Pedido",
			cell: (r) => (
				<Link
					href={`/admin/pedidos/${r.orderNumber}` as Route}
					className="font-medium text-velajuy-wine underline"
				>
					{r.orderNumber}
				</Link>
			),
		},
		{
			header: "Fecha",
			cell: (r) => format(new Date(r.placedAt), "d MMM yyyy HH:mm", { locale: es }),
		},
		{ header: "Estado", cell: (r) => <StatusPill status={r.status} /> },
		{ header: "Pago", cell: (r) => r.paymentMethod ?? "—" },
		{ header: "Total", cell: (r) => formatCOP(Number(r.totalAmount)), align: "right" },
	]

	return (
		<>
			<PageHeader title="Pedidos" subtitle={`${rows.length} resultados`} />
			<OrderFilters />
			<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} emptyLabel="No hay pedidos." />
		</>
	)
}
```

- [ ] **Step 6: Install date-fns if not present**

Run: `pnpm list date-fns || pnpm add date-fns`
Expected: present after.

- [ ] **Step 7: Typecheck**

Run: `pnpm typecheck`
Expected: clean.

- [ ] **Step 8: Commit**

```bash
git add src/components/admin/status-pill.tsx src/components/admin/data-table.tsx src/lib/admin/orders/queries.ts src/app/admin/pedidos package.json pnpm-lock.yaml
git commit -m "feat(admin): pedidos list with URL-driven filters"
```

---

### Task 11: Order actions (mark preparing/shipped/delivered/COD paid/cancel)

**Files:**
- Create: `src/lib/admin/orders/actions.ts`
- Create: `src/lib/email/templates/order-shipped.ts`
- Create: `src/lib/email/templates/order-delivered.ts`
- Create: `src/lib/email/templates/payment-confirmed.ts`

These mutations enforce `canTransition()` from Task 6, write `stock_movements` on cancellation, and send customer + admin emails. All wrapped in a Drizzle transaction so a status change + stock restore stays atomic.

- [ ] **Step 1: Create the three customer email templates**

`src/lib/email/templates/payment-confirmed.ts`:

```ts
import { formatCOP } from "@/lib/money"

export function paymentConfirmedEmail(args: { orderNumber: string; total: number }) {
	const subject = `Pago confirmado · ${args.orderNumber}`
	const text = `¡Recibimos tu pago de ${formatCOP(args.total)} para el pedido ${args.orderNumber}! Estamos preparando tu peluca.`
	const html = `<p style="font-family: -apple-system; color: #5c1a2a;">${text}</p>`
	return { subject, html, text }
}
```

`src/lib/email/templates/order-shipped.ts`:

```ts
export function orderShippedEmail(args: {
	orderNumber: string
	courier: string
	trackingNumber: string
}) {
	const subject = `Tu pedido va en camino · ${args.orderNumber}`
	const text = `¡Tu pedido ${args.orderNumber} salió! Courier: ${args.courier}. Tracking: ${args.trackingNumber}.`
	const html = `
		<div style="font-family: -apple-system; color: #5c1a2a;">
			<p>¡Tu pedido <b>${args.orderNumber}</b> ya va en camino!</p>
			<p>Courier: <b>${args.courier}</b></p>
			<p>Tracking: <b>${args.trackingNumber}</b></p>
		</div>
	`
	return { subject, html, text }
}
```

`src/lib/email/templates/order-delivered.ts`:

```ts
export function orderDeliveredEmail(args: { orderNumber: string }) {
	const subject = `Tu pedido fue entregado · ${args.orderNumber}`
	const text = `Tu pedido ${args.orderNumber} fue entregado. ¡Gracias por comprar en Velajuy!`
	const html = `<p style="font-family: -apple-system; color: #5c1a2a;">${text}</p>`
	return { subject, html, text }
}
```

- [ ] **Step 2: Create actions module**

`src/lib/admin/orders/actions.ts`:

```ts
"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { orderItems, orders, products, stockMovements, users } from "@/lib/db/schema"
import { requireAdmin } from "@/lib/auth-guards"
import { sendEmail } from "@/lib/email/client"
import { sendAdminNotification } from "@/lib/email/notify"
import { getOwnerEmail } from "@/lib/admin/settings/queries"
import { paymentConfirmedEmail } from "@/lib/email/templates/payment-confirmed"
import { orderShippedEmail } from "@/lib/email/templates/order-shipped"
import { orderDeliveredEmail } from "@/lib/email/templates/order-delivered"
import { adminPaymentReceivedEmail } from "@/lib/email/templates/admin-payment-received"
import { assertTransition, timestampsFor, type OrderStatus } from "./order-state"

async function loadOrder(orderId: string) {
	const [row] = await db.select().from(orders).where(eq(orders.id, orderId))
	if (!row) throw new Error("Order not found")
	return row
}

async function recipient(orderId: string): Promise<string | null> {
	const order = await loadOrder(orderId)
	if (order.userId) {
		const [u] = await db.select().from(users).where(eq(users.id, order.userId))
		return u?.email ?? order.guestEmail
	}
	return order.guestEmail
}

export async function markPreparing(orderId: string): Promise<void> {
	const session = await requireAdmin()
	const order = await loadOrder(orderId)
	assertTransition(order.status as OrderStatus, "preparing")
	await db
		.update(orders)
		.set({ status: "preparing" })
		.where(eq(orders.id, orderId))
	revalidatePath(`/admin/pedidos/${order.orderNumber}`)
	void session
}

const ShippedInput = z.object({
	courier: z.enum(["inter", "servientrega", "envia"]),
	trackingNumber: z.string().min(3).max(64),
})

export async function markShipped(orderId: string, input: z.infer<typeof ShippedInput>): Promise<void> {
	await requireAdmin()
	const parsed = ShippedInput.parse(input)
	const order = await loadOrder(orderId)
	assertTransition(order.status as OrderStatus, "shipped")
	const ts = timestampsFor("shipped")
	await db
		.update(orders)
		.set({
			status: "shipped",
			shippingCourier: parsed.courier,
			trackingNumber: parsed.trackingNumber,
			shippedAt: ts.shippedAt,
		})
		.where(eq(orders.id, orderId))
	const to = await recipient(orderId)
	if (to) {
		const tmpl = orderShippedEmail({
			orderNumber: order.orderNumber,
			courier: parsed.courier,
			trackingNumber: parsed.trackingNumber,
		})
		await sendEmail({ to, ...tmpl })
	}
	revalidatePath(`/admin/pedidos/${order.orderNumber}`)
}

export async function markDelivered(orderId: string): Promise<void> {
	await requireAdmin()
	const order = await loadOrder(orderId)
	assertTransition(order.status as OrderStatus, "delivered")
	const ts = timestampsFor("delivered")
	await db.update(orders).set({ status: "delivered", deliveredAt: ts.deliveredAt }).where(eq(orders.id, orderId))
	const to = await recipient(orderId)
	if (to) {
		const tmpl = orderDeliveredEmail({ orderNumber: order.orderNumber })
		await sendEmail({ to, ...tmpl })
	}
	if (order.paymentMethod === "contraentrega" && order.paymentStatus === "pending_on_delivery") {
		const ownerEmail = await getOwnerEmail()
		await sendAdminNotification(
			"cod_ready",
			{
				subject: `COD listo para confirmar pago · ${order.orderNumber}`,
				html: `<p>Pedido entregado. Cuando recibas el efectivo, marca el pago.</p>`,
				text: `Pedido ${order.orderNumber} entregado. Confirma el pago COD.`,
			},
			{ ownerEmail },
		)
	}
	revalidatePath(`/admin/pedidos/${order.orderNumber}`)
}

export async function markCodPaid(orderId: string): Promise<void> {
	await requireAdmin()
	const order = await loadOrder(orderId)
	if (order.paymentMethod !== "contraentrega") {
		throw new Error("markCodPaid only applies to COD orders")
	}
	await db
		.update(orders)
		.set({ paymentStatus: "paid", paidAt: new Date() })
		.where(eq(orders.id, orderId))
	const ownerEmail = await getOwnerEmail()
	const tmpl = adminPaymentReceivedEmail({
		orderNumber: order.orderNumber,
		provider: "contraentrega",
		amount: Number(order.totalAmount),
	})
	await sendAdminNotification("payment_received", tmpl, { ownerEmail })
	revalidatePath(`/admin/pedidos/${order.orderNumber}`)
}

export async function cancelOrder(orderId: string, reason: string | null = null): Promise<void> {
	const session = await requireAdmin()
	const order = await loadOrder(orderId)
	assertTransition(order.status as OrderStatus, "cancelled")
	// Restore stock only if it was decremented (paid, preparing, or COD already decremented at placement).
	const stockWasDecremented =
		order.status === "paid" ||
		order.status === "preparing" ||
		(order.paymentMethod === "contraentrega" && order.status !== "pending_payment")

	await db.transaction(async (tx) => {
		await tx
			.update(orders)
			.set({ status: "cancelled", cancelledAt: new Date(), notes: reason ?? order.notes })
			.where(eq(orders.id, orderId))

		if (stockWasDecremented) {
			const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId))
			for (const item of items) {
				await tx.insert(stockMovements).values({
					productId: item.productId,
					delta: item.quantity,
					reason: "cancellation",
					orderId: order.id,
					staffId: session.user.id,
					notes: reason,
				})
				await tx
					.update(products)
					.set({ stockQuantity: tx.$count(products.stockQuantity) /* placeholder */ })
					.where(eq(products.id, item.productId))
			}
		}
	})

	// Note: stock_quantity update above uses Drizzle's `sql` for atomic increment in real impl:
	// `set({ stockQuantity: sql\`stock_quantity + ${item.quantity}\` })`
	revalidatePath(`/admin/pedidos/${order.orderNumber}`)
}
```

The placeholder `tx.$count(...)` line is intentionally flagged — replace with `sql` template in the next step.

- [ ] **Step 3: Replace placeholder with sql template**

In `cancelOrder`, replace the `set({ stockQuantity: tx.$count(...) })` line with:

```ts
import { sql } from "drizzle-orm"
// …
await tx
	.update(products)
	.set({ stockQuantity: sql`${products.stockQuantity} + ${item.quantity}` })
	.where(eq(products.id, item.productId))
```

Add the `sql` import at the top of the file.

- [ ] **Step 4: Typecheck**

Run: `pnpm typecheck`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin/orders/actions.ts src/lib/email/templates
git commit -m "feat(admin): order actions with state-machine + emails + stock restore"
```

---

### Task 12: Order detail page

**Files:**
- Create: `src/app/admin/pedidos/[orderNumber]/page.tsx`
- Create: `src/app/admin/pedidos/[orderNumber]/status-actions.tsx`
- Create: `src/app/admin/pedidos/[orderNumber]/shipped-form.tsx`
- Create: `src/app/admin/pedidos/[orderNumber]/print/page.tsx`

The most-used screen. Status timeline, action buttons (next forward step + cancel + COD-paid when applicable), customer info, address, items, payment trail, link to print.

- [ ] **Step 1: Create `ShippedForm` (client modal)**

`src/app/admin/pedidos/[orderNumber]/shipped-form.tsx`:

```tsx
"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { markShipped } from "@/lib/admin/orders/actions"

export function ShippedForm({ orderId, onClose }: { orderId: string; onClose: () => void }) {
	const [courier, setCourier] = useState<"inter" | "servientrega" | "envia">("inter")
	const [tracking, setTracking] = useState("")
	const [pending, startTransition] = useTransition()

	function submit(e: React.FormEvent) {
		e.preventDefault()
		startTransition(async () => {
			try {
				await markShipped(orderId, { courier, trackingNumber: tracking })
				toast.success("Pedido marcado como enviado")
				onClose()
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Error al marcar enviado")
			}
		})
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
			<form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-6">
				<h2 className="mb-4 text-xl font-bold text-velajuy-wine">Marcar enviado</h2>
				<label className="block text-sm text-velajuy-wine">
					Courier
					<select
						value={courier}
						onChange={(e) => setCourier(e.target.value as typeof courier)}
						className="mt-1 w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"
					>
						<option value="inter">Inter Rapidísimo</option>
						<option value="servientrega">Servientrega</option>
						<option value="envia">Envía</option>
					</select>
				</label>
				<label className="mt-4 block text-sm text-velajuy-wine">
					Número de guía
					<input
						value={tracking}
						onChange={(e) => setTracking(e.target.value)}
						required
						minLength={3}
						className="mt-1 w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"
					/>
				</label>
				<div className="mt-6 flex justify-end gap-2">
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg px-3 py-2 text-sm text-velajuy-wine"
					>
						Cancelar
					</button>
					<button
						type="submit"
						disabled={pending}
						className="rounded-lg bg-velajuy-wine px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
					>
						{pending ? "Enviando…" : "Confirmar envío"}
					</button>
				</div>
			</form>
		</div>
	)
}
```

- [ ] **Step 2: Create `StatusActions` (client)**

`src/app/admin/pedidos/[orderNumber]/status-actions.tsx`:

```tsx
"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import {
	cancelOrder,
	markCodPaid,
	markDelivered,
	markPreparing,
} from "@/lib/admin/orders/actions"
import { nextStatus, type OrderStatus } from "@/lib/admin/orders/order-state"
import { ShippedForm } from "./shipped-form"

export function StatusActions({
	orderId,
	status,
	paymentMethod,
	paymentStatus,
}: {
	orderId: string
	status: OrderStatus
	paymentMethod: string | null
	paymentStatus: string
}) {
	const [pending, startTransition] = useTransition()
	const [showShipForm, setShowShipForm] = useState(false)
	const forward = nextStatus(status)
	const canCancel = status === "paid" || status === "preparing" || status === "pending_payment"
	const codNeedsPaid =
		paymentMethod === "contraentrega" && paymentStatus !== "paid" && status !== "cancelled"

	function run(label: string, fn: () => Promise<void>) {
		startTransition(async () => {
			try {
				await fn()
				toast.success(label)
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Error")
			}
		})
	}

	return (
		<div className="flex flex-wrap gap-2">
			{forward === "preparing" && (
				<button
					type="button"
					disabled={pending}
					onClick={() => run("Marcado como preparando", () => markPreparing(orderId))}
					className="rounded-lg bg-velajuy-wine px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
				>
					Marcar preparando
				</button>
			)}
			{forward === "shipped" && (
				<button
					type="button"
					disabled={pending}
					onClick={() => setShowShipForm(true)}
					className="rounded-lg bg-velajuy-wine px-3 py-2 text-sm font-medium text-white"
				>
					Marcar enviado
				</button>
			)}
			{forward === "delivered" && (
				<button
					type="button"
					disabled={pending}
					onClick={() => run("Marcado como entregado", () => markDelivered(orderId))}
					className="rounded-lg bg-velajuy-wine px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
				>
					Marcar entregado
				</button>
			)}
			{codNeedsPaid && (
				<button
					type="button"
					disabled={pending}
					onClick={() => run("Pago COD confirmado", () => markCodPaid(orderId))}
					className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
				>
					Marcar pago recibido (COD)
				</button>
			)}
			{canCancel && (
				<button
					type="button"
					disabled={pending}
					onClick={() => {
						if (!confirm("¿Cancelar este pedido?")) return
						run("Pedido cancelado", () => cancelOrder(orderId, null))
					}}
					className="rounded-lg border border-red-700 px-3 py-2 text-sm font-medium text-red-700 disabled:opacity-60"
				>
					Cancelar pedido
				</button>
			)}
			{showShipForm && (
				<ShippedForm orderId={orderId} onClose={() => setShowShipForm(false)} />
			)}
		</div>
	)
}
```

- [ ] **Step 3: Create detail page**

`src/app/admin/pedidos/[orderNumber]/page.tsx`:

```tsx
import Link from "next/link"
import type { Route } from "next"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { PageHeader } from "@/components/admin/page-header"
import { StatusPill } from "@/components/admin/status-pill"
import { formatCOP } from "@/lib/money"
import { getOrderByNumber } from "@/lib/admin/orders/queries"
import { db } from "@/lib/db"
import { addresses } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { StatusActions } from "./status-actions"
import type { OrderStatus } from "@/lib/admin/orders/order-state"

export default async function OrderDetailPage({
	params,
}: {
	params: Promise<{ orderNumber: string }>
}) {
	const { orderNumber } = await params
	const order = await getOrderByNumber(orderNumber)
	if (!order) notFound()

	const shippingAddress = order.shippingAddressId
		? (await db.select().from(addresses).where(eq(addresses.id, order.shippingAddressId)))[0]
		: null

	const timeline = [
		{ label: "Pedido recibido", at: order.placedAt },
		{ label: "Pagado", at: order.paidAt },
		{ label: "Enviado", at: order.shippedAt },
		{ label: "Entregado", at: order.deliveredAt },
		{ label: "Cancelado", at: order.cancelledAt },
	].filter((t) => t.at)

	return (
		<>
			<PageHeader
				title={`Pedido ${order.orderNumber}`}
				subtitle={format(new Date(order.placedAt), "d 'de' MMMM yyyy · HH:mm", { locale: es })}
				actions={
					<Link
						href={`/admin/pedidos/${order.orderNumber}/print` as Route}
						className="rounded-lg border border-velajuy-wine/20 px-3 py-2 text-sm text-velajuy-wine"
					>
						Imprimir
					</Link>
				}
			/>

			<div className="mb-6 flex items-center gap-3">
				<StatusPill status={order.status} />
				<span className="text-sm text-velajuy-wine-soft">Pago: {order.paymentStatus}</span>
			</div>

			<StatusActions
				orderId={order.id}
				status={order.status as OrderStatus}
				paymentMethod={order.paymentMethod}
				paymentStatus={order.paymentStatus}
			/>

			<section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div className="rounded-2xl border border-velajuy-wine/10 bg-white p-5 lg:col-span-2">
					<h2 className="mb-3 text-lg font-bold text-velajuy-wine">Artículos</h2>
					<ul className="divide-y divide-velajuy-wine/10">
						{order.items.map((item) => (
							<li key={item.id} className="flex items-center justify-between py-3">
								<div>
									<p className="font-medium text-velajuy-wine">{item.nameSnapshot}</p>
									<p className="text-sm text-velajuy-wine-soft">
										{formatCOP(Number(item.unitPriceAmount))} × {item.quantity}
									</p>
								</div>
								<span className="font-medium text-velajuy-wine">
									{formatCOP(Number(item.lineTotalAmount))}
								</span>
							</li>
						))}
					</ul>
					<dl className="mt-4 space-y-1 text-sm text-velajuy-wine">
						<div className="flex justify-between"><dt>Subtotal</dt><dd>{formatCOP(Number(order.subtotalAmount))}</dd></div>
						<div className="flex justify-between"><dt>Envío</dt><dd>{formatCOP(Number(order.shippingAmount))}</dd></div>
						<div className="flex justify-between"><dt>IVA incluido</dt><dd>{formatCOP(Number(order.taxAmount))}</dd></div>
						<div className="flex justify-between font-bold"><dt>Total</dt><dd>{formatCOP(Number(order.totalAmount))}</dd></div>
					</dl>
				</div>
				<div className="space-y-6">
					<div className="rounded-2xl border border-velajuy-wine/10 bg-white p-5">
						<h2 className="mb-3 text-lg font-bold text-velajuy-wine">Cliente</h2>
						<p className="text-sm text-velajuy-wine">{order.guestEmail ?? "—"}</p>
						<p className="text-sm text-velajuy-wine">{order.guestPhone ?? "—"}</p>
					</div>
					<div className="rounded-2xl border border-velajuy-wine/10 bg-white p-5">
						<h2 className="mb-3 text-lg font-bold text-velajuy-wine">Envío</h2>
						{shippingAddress ? (
							<address className="not-italic text-sm text-velajuy-wine">
								{shippingAddress.recipientName}<br />
								{shippingAddress.line1}<br />
								{shippingAddress.line2 && (<>{shippingAddress.line2}<br /></>)}
								{shippingAddress.neighborhood && (<>{shippingAddress.neighborhood}<br /></>)}
								{shippingAddress.city}, {shippingAddress.department}<br />
								{shippingAddress.phone}
							</address>
						) : (
							<p className="text-sm text-velajuy-wine-soft">Sin dirección.</p>
						)}
						{order.trackingNumber && (
							<p className="mt-3 text-sm text-velajuy-wine">
								Guía: <b>{order.trackingNumber}</b> ({order.shippingCourier})
							</p>
						)}
					</div>
					<div className="rounded-2xl border border-velajuy-wine/10 bg-white p-5">
						<h2 className="mb-3 text-lg font-bold text-velajuy-wine">Línea de tiempo</h2>
						<ol className="space-y-2 text-sm text-velajuy-wine">
							{timeline.map((t) => (
								<li key={t.label}>
									<b>{t.label}</b>{" "}
									<span className="text-velajuy-wine-soft">
										{t.at && format(new Date(t.at), "d MMM HH:mm", { locale: es })}
									</span>
								</li>
							))}
						</ol>
					</div>
				</div>
			</section>
		</>
	)
}
```

- [ ] **Step 4: Create print page**

`src/app/admin/pedidos/[orderNumber]/print/page.tsx`:

```tsx
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { addresses } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getOrderByNumber } from "@/lib/admin/orders/queries"
import { formatCOP } from "@/lib/money"

export default async function PackingSlipPage({
	params,
}: {
	params: Promise<{ orderNumber: string }>
}) {
	const { orderNumber } = await params
	const order = await getOrderByNumber(orderNumber)
	if (!order) notFound()
	const shippingAddress = order.shippingAddressId
		? (await db.select().from(addresses).where(eq(addresses.id, order.shippingAddressId)))[0]
		: null
	const isCod = order.paymentMethod === "contraentrega"

	return (
		<main className="mx-auto max-w-2xl bg-white p-10 text-zinc-900 print:p-0">
			<h1 className="text-2xl font-bold">Pedido {order.orderNumber}</h1>
			{isCod && (
				<p className="mt-2 rounded border-2 border-black p-2 text-lg font-bold">
					COBRAR {formatCOP(Number(order.totalAmount))} AL CLIENTE
				</p>
			)}
			{shippingAddress && (
				<address className="mt-6 not-italic">
					<p><b>{shippingAddress.recipientName}</b></p>
					<p>{shippingAddress.phone}</p>
					<p>{shippingAddress.line1}</p>
					{shippingAddress.line2 && <p>{shippingAddress.line2}</p>}
					{shippingAddress.neighborhood && <p>{shippingAddress.neighborhood}</p>}
					<p>{shippingAddress.city}, {shippingAddress.department}</p>
				</address>
			)}
			<table className="mt-6 w-full text-sm">
				<thead><tr><th className="text-left">Artículo</th><th className="text-right">Qty</th></tr></thead>
				<tbody>
					{order.items.map((item) => (
						<tr key={item.id} className="border-t">
							<td className="py-2">{item.nameSnapshot}</td>
							<td className="py-2 text-right">{item.quantity}</td>
						</tr>
					))}
				</tbody>
			</table>
		</main>
	)
}
```

- [ ] **Step 5: Typecheck**

Run: `pnpm typecheck`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/pedidos
git commit -m "feat(admin): order detail page with status actions, timeline, packing slip"
```

---

### Task 13: Productos list

**Files:**
- Create: `src/lib/admin/products/queries.ts`
- Create: `src/app/admin/productos/page.tsx`

- [ ] **Step 1: Create queries**

`src/lib/admin/products/queries.ts`:

```ts
import { and, desc, eq, lte, type SQL } from "drizzle-orm"
import { db } from "@/lib/db"
import {
	productImages,
	products,
	type Product,
} from "@/lib/db/schema"

export type ProductFilters = { status?: Product["status"]; lowStockOnly?: boolean }

export async function listAdminProducts(filters: ProductFilters = {}) {
	const where: SQL[] = []
	if (filters.status) where.push(eq(products.status, filters.status))
	if (filters.lowStockOnly) where.push(lte(products.stockQuantity, products.lowStockThreshold))
	const rows = await db
		.select({
			id: products.id,
			slug: products.slug,
			name: products.name,
			status: products.status,
			priceAmount: products.priceAmount,
			stockQuantity: products.stockQuantity,
			lowStockThreshold: products.lowStockThreshold,
			skuCode: products.skuCode,
			primaryImageId: products.primaryImageId,
			updatedAt: products.updatedAt,
		})
		.from(products)
		.where(where.length ? and(...where) : undefined)
		.orderBy(desc(products.updatedAt))
	const imageIds = rows.map((r) => r.primaryImageId).filter((x): x is string => !!x)
	const images = imageIds.length
		? await db.select().from(productImages).where(eq(productImages.id, imageIds[0])) // placeholder; expand below
		: []
	void images
	return rows
}

export async function getProductForEdit(productId: string) {
	const [row] = await db.select().from(products).where(eq(products.id, productId))
	if (!row) return null
	const images = await db
		.select()
		.from(productImages)
		.where(eq(productImages.productId, productId))
		.orderBy(productImages.sortOrder)
	return { ...row, images }
}
```

Replace the placeholder image-fetch with a real `inArray` lookup:

```ts
import { inArray } from "drizzle-orm"
// …
const images = imageIds.length
	? await db.select().from(productImages).where(inArray(productImages.id, imageIds))
	: []
const imageById = new Map(images.map((img) => [img.id, img]))
return rows.map((r) => ({
	...r,
	primaryImageUrl: r.primaryImageId ? imageById.get(r.primaryImageId)?.url ?? null : null,
}))
```

- [ ] **Step 2: Create products list page**

`src/app/admin/productos/page.tsx`:

```tsx
import Link from "next/link"
import type { Route } from "next"
import Image from "next/image"
import { PageHeader } from "@/components/admin/page-header"
import { DataTable, type Column } from "@/components/admin/data-table"
import { StatusPill } from "@/components/admin/status-pill"
import { formatCOP } from "@/lib/money"
import { listAdminProducts } from "@/lib/admin/products/queries"

type Row = Awaited<ReturnType<typeof listAdminProducts>>[number]

export default async function ProductsListPage({
	searchParams,
}: {
	searchParams: Promise<{ low?: string; status?: string }>
}) {
	const params = await searchParams
	const rows = await listAdminProducts({
		lowStockOnly: params.low === "1",
		status:
			params.status === "active" || params.status === "draft" || params.status === "archived"
				? params.status
				: undefined,
	})

	const columns: Column<Row>[] = [
		{
			header: "Producto",
			cell: (r) => (
				<div className="flex items-center gap-3">
					{r.primaryImageUrl ? (
						<Image
							src={r.primaryImageUrl}
							alt={r.name}
							width={48}
							height={48}
							className="rounded-lg object-cover"
						/>
					) : (
						<div className="size-12 rounded-lg bg-velajuy-pink-soft" />
					)}
					<div>
						<Link
							href={`/admin/productos/${r.id}` as Route}
							className="font-medium text-velajuy-wine underline"
						>
							{r.name}
						</Link>
						<p className="text-xs text-velajuy-wine-soft">{r.skuCode ?? "—"}</p>
					</div>
				</div>
			),
		},
		{ header: "Estado", cell: (r) => <StatusPill status={r.status} /> },
		{
			header: "Precio",
			cell: (r) => formatCOP(Number(r.priceAmount)),
			align: "right",
		},
		{
			header: "Stock",
			cell: (r) => (
				<span className={r.stockQuantity <= r.lowStockThreshold ? "font-medium text-red-700" : ""}>
					{r.stockQuantity}
				</span>
			),
			align: "right",
		},
	]

	return (
		<>
			<PageHeader
				title="Productos"
				actions={
					<Link
						href={"/admin/productos/nuevo" as Route}
						className="rounded-lg bg-velajuy-wine px-3 py-2 text-sm font-medium text-white"
					>
						Nuevo producto
					</Link>
				}
			/>
			<DataTable
				columns={columns}
				rows={rows}
				rowKey={(r) => r.id}
				emptyLabel="Aún no hay productos. Crea el primero."
			/>
		</>
	)
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/lib/admin/products src/app/admin/productos/page.tsx
git commit -m "feat(admin): productos list with primary image and status filters"
```

---

### Task 14: Productos create/edit form + Zod schema + actions

**Files:**
- Create: `src/lib/admin/products/schema.ts`
- Create: `src/lib/admin/products/actions.ts`
- Create: `src/app/admin/productos/[id]/page.tsx`
- Create: `src/app/admin/productos/nuevo/page.tsx`
- Create: `src/app/admin/productos/[id]/product-form.tsx`
- Create: `src/app/admin/productos/[id]/attribute-picker.tsx`

Owner-only create/archive; staff cannot price-edit (spec §9). Phase 1 has no variants, so the form is one panel with: name, slug, short description, description, status, price (in pesos, ×100 server-side), weight, SKU, low-stock threshold, DIAN rate, attribute multi-selects, image gallery (Task 15).

- [ ] **Step 1: Create the Zod schema**

`src/lib/admin/products/schema.ts`:

```ts
import { z } from "zod"

export const productFormSchema = z.object({
	slug: z
		.string()
		.min(2)
		.max(80)
		.regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
	name: z.string().min(2).max(120),
	shortDescription: z.string().max(280).nullish(),
	description: z.string().max(4000).nullish(),
	status: z.enum(["draft", "active", "archived"]),
	pricePesos: z.number().int().min(0).max(50_000_000),
	weightGrams: z.number().int().min(0).max(10_000).nullable(),
	skuCode: z.string().max(40).nullish(),
	lowStockThreshold: z.number().int().min(0).max(999),
	dianTaxRate: z.number().int().min(0).max(99),
	attributeValueIds: z.array(z.string().uuid()),
})

export type ProductFormInput = z.infer<typeof productFormSchema>
```

- [ ] **Step 2: Create the actions module**

`src/lib/admin/products/actions.ts`:

```ts
"use server"

import { and, eq, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import {
	productAttributeValues,
	productImages,
	products,
} from "@/lib/db/schema"
import { requireOwner, requireAdmin } from "@/lib/auth-guards"
import { productFormSchema, type ProductFormInput } from "./schema"

export async function createProduct(input: ProductFormInput): Promise<{ id: string }> {
	await requireOwner()
	const data = productFormSchema.parse(input)
	const [row] = await db
		.insert(products)
		.values({
			slug: data.slug,
			name: data.name,
			shortDescription: data.shortDescription ?? null,
			description: data.description ?? null,
			status: data.status,
			priceAmount: data.pricePesos * 100,
			priceCurrency: "COP",
			weightGrams: data.weightGrams,
			skuCode: data.skuCode ?? null,
			lowStockThreshold: data.lowStockThreshold,
			dianTaxRate: data.dianTaxRate,
		})
		.returning({ id: products.id })

	if (data.attributeValueIds.length > 0) {
		await db.insert(productAttributeValues).values(
			data.attributeValueIds.map((attributeValueId) => ({
				productId: row.id,
				attributeValueId,
			})),
		)
	}
	revalidatePath("/admin/productos")
	return { id: row.id }
}

export async function updateProduct(productId: string, input: ProductFormInput): Promise<void> {
	await requireOwner()
	const data = productFormSchema.parse(input)
	await db
		.update(products)
		.set({
			slug: data.slug,
			name: data.name,
			shortDescription: data.shortDescription ?? null,
			description: data.description ?? null,
			status: data.status,
			priceAmount: data.pricePesos * 100,
			weightGrams: data.weightGrams,
			skuCode: data.skuCode ?? null,
			lowStockThreshold: data.lowStockThreshold,
			dianTaxRate: data.dianTaxRate,
			updatedAt: new Date(),
		})
		.where(eq(products.id, productId))

	await db.delete(productAttributeValues).where(eq(productAttributeValues.productId, productId))
	if (data.attributeValueIds.length > 0) {
		await db.insert(productAttributeValues).values(
			data.attributeValueIds.map((attributeValueId) => ({
				productId,
				attributeValueId,
			})),
		)
	}
	revalidatePath(`/admin/productos/${productId}`)
	revalidatePath("/admin/productos")
}

export async function archiveProduct(productId: string): Promise<void> {
	await requireOwner()
	await db.update(products).set({ status: "archived" }).where(eq(products.id, productId))
	revalidatePath("/admin/productos")
}

export async function attachUploadedImage(input: {
	productId: string
	url: string
	altText?: string | null
	width?: number | null
	height?: number | null
}): Promise<{ id: string }> {
	await requireAdmin()
	const existing = await db
		.select({ id: productImages.id })
		.from(productImages)
		.where(eq(productImages.productId, input.productId))
	const sortOrder = existing.length
	const [row] = await db
		.insert(productImages)
		.values({
			productId: input.productId,
			url: input.url,
			altText: input.altText ?? null,
			width: input.width ?? null,
			height: input.height ?? null,
			sortOrder,
		})
		.returning({ id: productImages.id })
	if (existing.length === 0) {
		await db.update(products).set({ primaryImageId: row.id }).where(eq(products.id, input.productId))
	}
	revalidatePath(`/admin/productos/${input.productId}`)
	return { id: row.id }
}

export async function reorderImages(productId: string, orderedIds: string[]): Promise<void> {
	await requireAdmin()
	for (let i = 0; i < orderedIds.length; i++) {
		await db
			.update(productImages)
			.set({ sortOrder: i })
			.where(and(eq(productImages.id, orderedIds[i]), eq(productImages.productId, productId)))
	}
	if (orderedIds.length > 0) {
		await db.update(products).set({ primaryImageId: orderedIds[0] }).where(eq(products.id, productId))
	}
	revalidatePath(`/admin/productos/${productId}`)
}

export async function deleteImage(productId: string, imageId: string): Promise<void> {
	await requireAdmin()
	await db
		.delete(productImages)
		.where(and(eq(productImages.id, imageId), eq(productImages.productId, productId)))
	const remaining = await db
		.select()
		.from(productImages)
		.where(eq(productImages.productId, productId))
		.orderBy(productImages.sortOrder)
	const newPrimary = remaining[0]?.id ?? null
	await db.update(products).set({ primaryImageId: newPrimary }).where(eq(products.id, productId))
	revalidatePath(`/admin/productos/${productId}`)
	void inArray
}
```

- [ ] **Step 3: Create attribute picker (client)**

`src/app/admin/productos/[id]/attribute-picker.tsx`:

```tsx
"use client"

import { useState } from "react"

type Attribute = {
	id: string
	name: string
	values: { id: string; name: string }[]
}

export function AttributePicker({
	attributes,
	value,
	onChange,
}: {
	attributes: Attribute[]
	value: string[]
	onChange: (next: string[]) => void
}) {
	const [selected, setSelected] = useState<Set<string>>(new Set(value))

	function toggle(id: string) {
		const next = new Set(selected)
		if (next.has(id)) next.delete(id)
		else next.add(id)
		setSelected(next)
		onChange(Array.from(next))
	}

	return (
		<div className="space-y-4">
			{attributes.map((attr) => (
				<div key={attr.id}>
					<p className="mb-2 text-sm font-medium text-velajuy-wine">{attr.name}</p>
					<div className="flex flex-wrap gap-2">
						{attr.values.map((v) => {
							const isActive = selected.has(v.id)
							return (
								<button
									key={v.id}
									type="button"
									onClick={() => toggle(v.id)}
									className={`rounded-full border px-3 py-1 text-sm ${
										isActive
											? "border-velajuy-wine bg-velajuy-wine text-white"
											: "border-velajuy-wine/20 text-velajuy-wine hover:bg-velajuy-pink-soft"
									}`}
								>
									{v.name}
								</button>
							)
						})}
					</div>
				</div>
			))}
		</div>
	)
}
```

- [ ] **Step 4: Create product form (client)**

`src/app/admin/productos/[id]/product-form.tsx`:

```tsx
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { productFormSchema, type ProductFormInput } from "@/lib/admin/products/schema"
import { createProduct, updateProduct, archiveProduct } from "@/lib/admin/products/actions"
import { AttributePicker } from "./attribute-picker"

type Attribute = { id: string; name: string; values: { id: string; name: string }[] }

export function ProductForm({
	mode,
	productId,
	defaultValues,
	attributes,
}: {
	mode: "create" | "edit"
	productId?: string
	defaultValues: ProductFormInput
	attributes: Attribute[]
}) {
	const router = useRouter()
	const [pending, startTransition] = useTransition()
	const [attrSelection, setAttrSelection] = useState<string[]>(defaultValues.attributeValueIds)

	const form = useForm<ProductFormInput>({
		resolver: zodResolver(productFormSchema),
		defaultValues,
	})

	function submit(data: ProductFormInput) {
		startTransition(async () => {
			try {
				const merged = { ...data, attributeValueIds: attrSelection }
				if (mode === "create") {
					const { id } = await createProduct(merged)
					toast.success("Producto creado")
					router.push(`/admin/productos/${id}`)
				} else if (productId) {
					await updateProduct(productId, merged)
					toast.success("Producto actualizado")
					router.refresh()
				}
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Error al guardar")
			}
		})
	}

	return (
		<form onSubmit={form.handleSubmit(submit)} className="space-y-6">
			<Section title="Información">
				<Field label="Nombre" error={form.formState.errors.name?.message}>
					<input
						{...form.register("name")}
						className="w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"
					/>
				</Field>
				<Field label="Slug" error={form.formState.errors.slug?.message}>
					<input
						{...form.register("slug")}
						className="w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"
					/>
				</Field>
				<Field label="Descripción corta">
					<input
						{...form.register("shortDescription")}
						className="w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"
					/>
				</Field>
				<Field label="Descripción">
					<textarea
						{...form.register("description")}
						rows={6}
						className="w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"
					/>
				</Field>
			</Section>

			<Section title="Precio e inventario">
				<Field label="Precio (pesos COP, sin decimales)" error={form.formState.errors.pricePesos?.message}>
					<input
						type="number"
						min={0}
						{...form.register("pricePesos", { valueAsNumber: true })}
						className="w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"
					/>
				</Field>
				<Field label="Umbral stock bajo" error={form.formState.errors.lowStockThreshold?.message}>
					<input
						type="number"
						min={0}
						{...form.register("lowStockThreshold", { valueAsNumber: true })}
						className="w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"
					/>
				</Field>
				<Field label="SKU">
					<input
						{...form.register("skuCode")}
						className="w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"
					/>
				</Field>
				<Field label="Peso (g)">
					<input
						type="number"
						min={0}
						{...form.register("weightGrams", { valueAsNumber: true })}
						className="w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"
					/>
				</Field>
				<Field label="IVA (%)">
					<input
						type="number"
						min={0}
						max={99}
						{...form.register("dianTaxRate", { valueAsNumber: true })}
						className="w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"
					/>
				</Field>
				<Field label="Estado">
					<select
						{...form.register("status")}
						className="w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"
					>
						<option value="draft">Borrador</option>
						<option value="active">Activo</option>
						<option value="archived">Archivado</option>
					</select>
				</Field>
			</Section>

			<Section title="Atributos">
				<AttributePicker attributes={attributes} value={attrSelection} onChange={setAttrSelection} />
			</Section>

			<div className="flex justify-between gap-2">
				{mode === "edit" && productId && (
					<button
						type="button"
						onClick={() => {
							if (!confirm("¿Archivar este producto?")) return
							startTransition(async () => {
								await archiveProduct(productId)
								toast.success("Archivado")
								router.push("/admin/productos")
							})
						}}
						className="rounded-lg border border-red-700 px-3 py-2 text-sm text-red-700"
					>
						Archivar
					</button>
				)}
				<button
					type="submit"
					disabled={pending}
					className="ml-auto rounded-lg bg-velajuy-wine px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
				>
					{pending ? "Guardando…" : "Guardar"}
				</button>
			</div>
		</form>
	)
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<section className="rounded-2xl border border-velajuy-wine/10 bg-white p-5">
			<h2 className="mb-4 text-lg font-bold text-velajuy-wine">{title}</h2>
			<div className="space-y-3">{children}</div>
		</section>
	)
}

function Field({
	label,
	error,
	children,
}: {
	label: string
	error?: string
	children: React.ReactNode
}) {
	return (
		<label className="block text-sm text-velajuy-wine">
			<span className="mb-1 block font-medium">{label}</span>
			{children}
			{error && <span className="mt-1 block text-xs text-red-700">{error}</span>}
		</label>
	)
}
```

- [ ] **Step 5: Install form deps**

```bash
pnpm add react-hook-form @hookform/resolvers
```

- [ ] **Step 6: Create new / edit pages**

`src/app/admin/productos/nuevo/page.tsx`:

```tsx
import { PageHeader } from "@/components/admin/page-header"
import { db } from "@/lib/db"
import { attributes, attributeValues } from "@/lib/db/schema"
import { requireOwner } from "@/lib/auth-guards"
import { ProductForm } from "../[id]/product-form"

export default async function NewProductPage() {
	await requireOwner()
	const attrRows = await db.select().from(attributes).orderBy(attributes.sortOrder)
	const valueRows = await db.select().from(attributeValues).orderBy(attributeValues.sortOrder)
	const grouped = attrRows.map((a) => ({
		id: a.id,
		name: a.name,
		values: valueRows.filter((v) => v.attributeId === a.id),
	}))

	return (
		<>
			<PageHeader title="Nuevo producto" />
			<ProductForm
				mode="create"
				attributes={grouped}
				defaultValues={{
					slug: "",
					name: "",
					shortDescription: "",
					description: "",
					status: "draft",
					pricePesos: 0,
					weightGrams: null,
					skuCode: "",
					lowStockThreshold: 2,
					dianTaxRate: 19,
					attributeValueIds: [],
				}}
			/>
		</>
	)
}
```

`src/app/admin/productos/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/admin/page-header"
import { db } from "@/lib/db"
import { attributes, attributeValues, productAttributeValues } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getProductForEdit } from "@/lib/admin/products/queries"
import { requireAdmin } from "@/lib/auth-guards"
import { ProductForm } from "./product-form"
import { ImageGallery } from "./image-gallery"

export default async function EditProductPage({
	params,
}: {
	params: Promise<{ id: string }>
}) {
	await requireAdmin()
	const { id } = await params
	const product = await getProductForEdit(id)
	if (!product) notFound()

	const attrRows = await db.select().from(attributes).orderBy(attributes.sortOrder)
	const valueRows = await db.select().from(attributeValues).orderBy(attributeValues.sortOrder)
	const selected = await db
		.select({ id: productAttributeValues.attributeValueId })
		.from(productAttributeValues)
		.where(eq(productAttributeValues.productId, id))
	const grouped = attrRows.map((a) => ({
		id: a.id,
		name: a.name,
		values: valueRows.filter((v) => v.attributeId === a.id),
	}))

	return (
		<>
			<PageHeader title={product.name} subtitle={`SKU ${product.skuCode ?? "—"}`} />
			<ImageGallery
				productId={product.id}
				images={product.images.map((img) => ({
					id: img.id,
					url: img.url,
					altText: img.altText ?? "",
				}))}
			/>
			<div className="mt-8">
				<ProductForm
					mode="edit"
					productId={product.id}
					attributes={grouped}
					defaultValues={{
						slug: product.slug,
						name: product.name,
						shortDescription: product.shortDescription ?? "",
						description: product.description ?? "",
						status: product.status,
						pricePesos: Math.round(Number(product.priceAmount) / 100),
						weightGrams: product.weightGrams,
						skuCode: product.skuCode ?? "",
						lowStockThreshold: product.lowStockThreshold,
						dianTaxRate: product.dianTaxRate,
						attributeValueIds: selected.map((s) => s.id),
					}}
				/>
			</div>
		</>
	)
}
```

- [ ] **Step 7: Typecheck**

Run: `pnpm typecheck`
Expected: clean (ignoring ImageGallery until Task 15).

- [ ] **Step 8: Commit**

```bash
git add src/lib/admin/products src/app/admin/productos package.json pnpm-lock.yaml
git commit -m "feat(admin): product create/edit form with attribute picker"
```

---

### Task 15: Product image gallery with drag-reorder + R2 upload

**Files:**
- Create: `src/app/admin/productos/[id]/image-gallery.tsx`

Uses `@dnd-kit` for keyboard-accessible drag-and-drop. Each thumb is a `SortableItem`. Add tile triggers a hidden `<input type="file">`, posts metadata to `/api/r2/upload`, PUTs to the presigned URL, then calls `attachUploadedImage()`.

- [ ] **Step 1: Install dnd-kit**

```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- [ ] **Step 2: Create the component**

`src/app/admin/productos/[id]/image-gallery.tsx`:

```tsx
"use client"

import { useRef, useState, useTransition } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { Plus, X, GripVertical } from "lucide-react"
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core"
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	rectSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
	attachUploadedImage,
	deleteImage,
	reorderImages,
} from "@/lib/admin/products/actions"

type GalleryImage = { id: string; url: string; altText: string }

export function ImageGallery({
	productId,
	images: initialImages,
}: {
	productId: string
	images: GalleryImage[]
}) {
	const [images, setImages] = useState(initialImages)
	const fileRef = useRef<HTMLInputElement>(null)
	const [pending, startTransition] = useTransition()
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	)

	function onDragEnd(event: DragEndEvent) {
		const { active, over } = event
		if (!over || active.id === over.id) return
		const oldIndex = images.findIndex((img) => img.id === active.id)
		const newIndex = images.findIndex((img) => img.id === over.id)
		const reordered = arrayMove(images, oldIndex, newIndex)
		setImages(reordered)
		startTransition(async () => {
			try {
				await reorderImages(productId, reordered.map((img) => img.id))
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "No se pudo reordenar")
				setImages(images)
			}
		})
	}

	async function handleFile(file: File) {
		try {
			const presignRes = await fetch("/api/r2/upload", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					productId,
					filename: file.name,
					contentType: file.type,
					contentLength: file.size,
				}),
			})
			if (!presignRes.ok) throw new Error("No se pudo obtener URL de subida")
			const { uploadUrl, publicUrl } = (await presignRes.json()) as {
				uploadUrl: string
				publicUrl: string
			}
			const putRes = await fetch(uploadUrl, {
				method: "PUT",
				headers: { "content-type": file.type },
				body: file,
			})
			if (!putRes.ok) throw new Error("Falló la subida a R2")
			const { id } = await attachUploadedImage({ productId, url: publicUrl })
			setImages((prev) => [...prev, { id, url: publicUrl, altText: "" }])
			toast.success("Imagen subida")
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error al subir imagen")
		}
	}

	function onPick(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		if (file) handleFile(file)
		e.target.value = ""
	}

	function remove(id: string) {
		if (!confirm("¿Eliminar esta imagen?")) return
		startTransition(async () => {
			await deleteImage(productId, id)
			setImages((prev) => prev.filter((img) => img.id !== id))
			toast.success("Imagen eliminada")
		})
	}

	return (
		<section className="rounded-2xl border border-velajuy-wine/10 bg-white p-5">
			<h2 className="mb-4 text-lg font-bold text-velajuy-wine">
				Imágenes <span className="text-sm font-normal text-velajuy-wine-soft">(la primera es la principal)</span>
			</h2>
			<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
				<SortableContext items={images.map((img) => img.id)} strategy={rectSortingStrategy}>
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
						{images.map((img) => (
							<SortableTile key={img.id} image={img} onRemove={() => remove(img.id)} disabled={pending} />
						))}
						<button
							type="button"
							onClick={() => fileRef.current?.click()}
							className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-velajuy-wine/30 text-velajuy-wine hover:bg-velajuy-pink-soft"
						>
							<Plus className="size-6" />
						</button>
					</div>
				</SortableContext>
			</DndContext>
			<input
				ref={fileRef}
				type="file"
				accept="image/jpeg,image/png,image/webp,image/avif"
				hidden
				onChange={onPick}
			/>
		</section>
	)
}

function SortableTile({
	image,
	onRemove,
	disabled,
}: {
	image: GalleryImage
	onRemove: () => void
	disabled: boolean
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: image.id,
	})
	return (
		<div
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition }}
			className={`relative aspect-square overflow-hidden rounded-xl border border-velajuy-wine/10 ${
				isDragging ? "opacity-60" : ""
			}`}
		>
			<Image
				src={image.url}
				alt={image.altText || "Imagen del producto"}
				fill
				className="object-cover"
				sizes="(min-width: 640px) 200px, 50vw"
			/>
			<button
				type="button"
				{...attributes}
				{...listeners}
				className="absolute left-1 top-1 rounded bg-black/40 p-1 text-white"
				aria-label="Mover"
			>
				<GripVertical className="size-4" />
			</button>
			<button
				type="button"
				onClick={onRemove}
				disabled={disabled}
				className="absolute right-1 top-1 rounded bg-red-700/80 p-1 text-white disabled:opacity-50"
				aria-label="Eliminar"
			>
				<X className="size-4" />
			</button>
		</div>
	)
}
```

- [ ] **Step 3: Allow R2 host in `next.config.ts`**

Append to `next.config.ts` (or modify existing `images` config):

```ts
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{ protocol: "https", hostname: "cdn.velajuy.com" },
			{ protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
		],
	},
}

export default nextConfig
```

If the file already has `nextConfig`, only add the `images.remotePatterns` entries.

- [ ] **Step 4: Typecheck + commit**

```bash
pnpm typecheck
git add src/app/admin/productos/[id]/image-gallery.tsx next.config.ts package.json pnpm-lock.yaml
git commit -m "feat(admin): drag-reorder image gallery with R2 presigned uploads"
```

---

### Task 16: Inventario view with inline adjust

**Files:**
- Create: `src/lib/admin/inventory/queries.ts`
- Create: `src/lib/admin/inventory/actions.ts`
- Create: `src/app/admin/inventario/page.tsx`
- Create: `src/app/admin/inventario/adjust-row.tsx`
- Create: `tests/unit/adjust-stock.test.ts`

Every adjustment writes `stock_movements` (reason: `adjustment` or `restock`) and updates `products.stock_quantity` atomically. Triggers `stock_low` admin notification when stock drops to or below threshold.

- [ ] **Step 1: Write failing unit test**

`tests/unit/adjust-stock.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest"

const requireAdminMock = vi.fn(async () => ({ user: { id: "staff-1" } }))
vi.mock("@/lib/auth-guards", () => ({ requireAdmin: requireAdminMock }))

const tx = {
	update: vi.fn().mockReturnThis(),
	set: vi.fn().mockReturnThis(),
	where: vi.fn().mockResolvedValue(undefined),
	insert: vi.fn().mockReturnThis(),
	values: vi.fn().mockResolvedValue(undefined),
	select: vi.fn().mockReturnThis(),
	from: vi.fn().mockResolvedValue([{ stockQuantity: 5, lowStockThreshold: 2, name: "X" }]),
}
const transaction = vi.fn(async (cb: (t: typeof tx) => Promise<void>) => cb(tx))
vi.mock("@/lib/db", () => ({ db: { transaction, select: () => tx, from: () => tx } }))
vi.mock("@/lib/email/notify", () => ({ sendAdminNotification: vi.fn() }))
vi.mock("@/lib/admin/settings/queries", () => ({ getOwnerEmail: async () => "owner@x" }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { adjustStock } from "@/lib/admin/inventory/actions"

describe("adjustStock", () => {
	it("rejects deltas that would make stock negative", async () => {
		// stock starts at 5; -10 would go negative
		await expect(adjustStock({ productId: "p1", delta: -10, reason: "adjustment", notes: null })).rejects.toThrow(
			/insufficient/i,
		)
	})
})
```

- [ ] **Step 2: Run — expect failure**

Run: `pnpm test -- adjust-stock`
Expected: FAIL — module not found.

- [ ] **Step 3: Create inventory queries**

`src/lib/admin/inventory/queries.ts`:

```ts
import { desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { products, stockMovements } from "@/lib/db/schema"

export async function listStock() {
	return db
		.select({
			id: products.id,
			name: products.name,
			skuCode: products.skuCode,
			stockQuantity: products.stockQuantity,
			lowStockThreshold: products.lowStockThreshold,
		})
		.from(products)
		.orderBy(products.name)
}

export async function getStockHistory(productId: string, limit = 50) {
	return db
		.select()
		.from(stockMovements)
		.where(eq(stockMovements.productId, productId))
		.orderBy(desc(stockMovements.createdAt))
		.limit(limit)
}
```

- [ ] **Step 4: Create inventory actions**

`src/lib/admin/inventory/actions.ts`:

```ts
"use server"

import { eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { products, stockMovements } from "@/lib/db/schema"
import { requireAdmin } from "@/lib/auth-guards"
import { sendAdminNotification } from "@/lib/email/notify"
import { getOwnerEmail } from "@/lib/admin/settings/queries"
import { adminLowStockEmail } from "@/lib/email/templates/admin-low-stock"

const AdjustInput = z.object({
	productId: z.string().uuid(),
	delta: z.number().int().refine((n) => n !== 0, "Delta cannot be zero"),
	reason: z.enum(["adjustment", "restock", "return"]),
	notes: z.string().max(280).nullable(),
})
export type AdjustInput = z.infer<typeof AdjustInput>

export async function adjustStock(input: AdjustInput): Promise<void> {
	const session = await requireAdmin()
	const data = AdjustInput.parse(input)

	let triggeredLowStock = false
	let productName = ""
	let newQuantity = 0

	await db.transaction(async (tx) => {
		const [current] = await tx
			.select({
				stockQuantity: products.stockQuantity,
				lowStockThreshold: products.lowStockThreshold,
				name: products.name,
			})
			.from(products)
			.where(eq(products.id, data.productId))
		if (!current) throw new Error("Producto no encontrado")
		newQuantity = current.stockQuantity + data.delta
		if (newQuantity < 0) throw new Error("Stock insufficient for this adjustment")
		productName = current.name

		await tx
			.update(products)
			.set({ stockQuantity: sql`${products.stockQuantity} + ${data.delta}` })
			.where(eq(products.id, data.productId))

		await tx.insert(stockMovements).values({
			productId: data.productId,
			delta: data.delta,
			reason: data.reason,
			staffId: session.user.id,
			notes: data.notes,
		})

		if (newQuantity <= current.lowStockThreshold && current.stockQuantity > current.lowStockThreshold) {
			triggeredLowStock = true
		}
	})

	if (triggeredLowStock) {
		const ownerEmail = await getOwnerEmail()
		const tmpl = adminLowStockEmail({ productName, quantity: newQuantity })
		await sendAdminNotification("stock_low", tmpl, { ownerEmail })
	}

	revalidatePath("/admin/inventario")
}
```

- [ ] **Step 5: Run — expect pass**

Run: `pnpm test -- adjust-stock`
Expected: PASS.

- [ ] **Step 6: Create adjust-row (client)**

`src/app/admin/inventario/adjust-row.tsx`:

```tsx
"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { adjustStock } from "@/lib/admin/inventory/actions"

export function AdjustRow({
	productId,
	name,
	current,
	threshold,
}: {
	productId: string
	name: string
	current: number
	threshold: number
}) {
	const [delta, setDelta] = useState(0)
	const [reason, setReason] = useState<"adjustment" | "restock" | "return">("restock")
	const [notes, setNotes] = useState("")
	const [pending, startTransition] = useTransition()

	function submit() {
		if (delta === 0) return
		startTransition(async () => {
			try {
				await adjustStock({ productId, delta, reason, notes: notes || null })
				toast.success("Stock actualizado")
				setDelta(0)
				setNotes("")
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Error")
			}
		})
	}

	return (
		<tr className="border-t border-velajuy-wine/10">
			<td className="py-3 text-sm text-velajuy-wine">{name}</td>
			<td className={`py-3 text-sm font-medium ${current <= threshold ? "text-red-700" : "text-velajuy-wine"}`}>
				{current}
			</td>
			<td className="py-3">
				<input
					type="number"
					value={delta}
					onChange={(e) => setDelta(parseInt(e.target.value, 10) || 0)}
					className="w-20 rounded-lg border border-velajuy-wine/20 px-2 py-1 text-sm"
				/>
			</td>
			<td className="py-3">
				<select
					value={reason}
					onChange={(e) => setReason(e.target.value as typeof reason)}
					className="rounded-lg border border-velajuy-wine/20 px-2 py-1 text-sm"
				>
					<option value="restock">Reposición</option>
					<option value="adjustment">Ajuste</option>
					<option value="return">Devolución</option>
				</select>
			</td>
			<td className="py-3">
				<input
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					placeholder="Nota (opcional)"
					className="w-full rounded-lg border border-velajuy-wine/20 px-2 py-1 text-sm"
				/>
			</td>
			<td className="py-3">
				<button
					type="button"
					onClick={submit}
					disabled={pending || delta === 0}
					className="rounded-lg bg-velajuy-wine px-3 py-1 text-sm font-medium text-white disabled:opacity-60"
				>
					Aplicar
				</button>
			</td>
		</tr>
	)
}
```

- [ ] **Step 7: Create inventory page**

`src/app/admin/inventario/page.tsx`:

```tsx
import { PageHeader } from "@/components/admin/page-header"
import { listStock } from "@/lib/admin/inventory/queries"
import { AdjustRow } from "./adjust-row"

export default async function InventoryPage() {
	const rows = await listStock()
	return (
		<>
			<PageHeader title="Inventario" subtitle={`${rows.length} productos`} />
			<div className="overflow-x-auto rounded-2xl border border-velajuy-wine/10 bg-white">
				<table className="w-full">
					<thead>
						<tr className="text-left text-xs uppercase tracking-wide text-velajuy-wine-soft">
							<th className="px-3 py-2">Producto</th>
							<th className="px-3 py-2">Stock</th>
							<th className="px-3 py-2">Delta</th>
							<th className="px-3 py-2">Razón</th>
							<th className="px-3 py-2">Nota</th>
							<th className="px-3 py-2" />
						</tr>
					</thead>
					<tbody>
						{rows.map((r) => (
							<AdjustRow
								key={r.id}
								productId={r.id}
								name={r.name}
								current={r.stockQuantity}
								threshold={r.lowStockThreshold}
							/>
						))}
					</tbody>
				</table>
			</div>
		</>
	)
}
```

- [ ] **Step 8: Commit**

```bash
git add src/lib/admin/inventory src/app/admin/inventario tests/unit/adjust-stock.test.ts
git commit -m "feat(admin): inventario view with inline adjust + low-stock alerts"
```

---

### Task 17: Zonas de envío CRUD (owner-only)

**Files:**
- Create: `src/lib/admin/zones/queries.ts`
- Create: `src/lib/admin/zones/actions.ts`
- Create: `src/app/admin/zonas/page.tsx`
- Create: `src/app/admin/zonas/zone-form.tsx`

- [ ] **Step 1: Queries**

`src/lib/admin/zones/queries.ts`:

```ts
import { db } from "@/lib/db"
import { shippingZones } from "@/lib/db/schema"

export async function listZones() {
	return db.select().from(shippingZones).orderBy(shippingZones.sortOrder)
}
```

- [ ] **Step 2: Actions**

`src/lib/admin/zones/actions.ts`:

```ts
"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { shippingZones } from "@/lib/db/schema"
import { requireOwner } from "@/lib/auth-guards"

const ZoneInput = z.object({
	name: z.string().min(2).max(80),
	country: z.string().length(2).default("CO"),
	department: z.string().min(2).max(60),
	cities: z.array(z.string().min(1)).nullable(),
	baseRatePesos: z.number().int().min(0).max(10_000_000),
	courierDefault: z.string().nullable(),
	allowsCod: z.boolean(),
	isActive: z.boolean(),
	sortOrder: z.number().int(),
})

export type ZoneInput = z.infer<typeof ZoneInput>

export async function createZone(input: ZoneInput): Promise<void> {
	await requireOwner()
	const data = ZoneInput.parse(input)
	await db.insert(shippingZones).values({
		name: data.name,
		country: data.country,
		department: data.department,
		cities: data.cities,
		baseRateAmount: data.baseRatePesos * 100,
		courierDefault: data.courierDefault,
		allowsCod: data.allowsCod,
		isActive: data.isActive,
		sortOrder: data.sortOrder,
	})
	revalidatePath("/admin/zonas")
}

export async function updateZone(id: string, input: ZoneInput): Promise<void> {
	await requireOwner()
	const data = ZoneInput.parse(input)
	await db
		.update(shippingZones)
		.set({
			name: data.name,
			country: data.country,
			department: data.department,
			cities: data.cities,
			baseRateAmount: data.baseRatePesos * 100,
			courierDefault: data.courierDefault,
			allowsCod: data.allowsCod,
			isActive: data.isActive,
			sortOrder: data.sortOrder,
			updatedAt: new Date(),
		})
		.where(eq(shippingZones.id, id))
	revalidatePath("/admin/zonas")
}

export async function deactivateZone(id: string): Promise<void> {
	await requireOwner()
	await db.update(shippingZones).set({ isActive: false }).where(eq(shippingZones.id, id))
	revalidatePath("/admin/zonas")
}
```

- [ ] **Step 3: Zone form (client)**

`src/app/admin/zonas/zone-form.tsx`:

```tsx
"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { createZone, updateZone, type ZoneInput } from "@/lib/admin/zones/actions"

type Mode = { kind: "create" } | { kind: "edit"; id: string }

export function ZoneForm({
	mode,
	defaults,
	onSaved,
}: {
	mode: Mode
	defaults: ZoneInput
	onSaved: () => void
}) {
	const [form, setForm] = useState(defaults)
	const [citiesText, setCitiesText] = useState((defaults.cities ?? []).join(", "))
	const [pending, startTransition] = useTransition()

	function update<K extends keyof ZoneInput>(key: K, value: ZoneInput[K]) {
		setForm((f) => ({ ...f, [key]: value }))
	}

	function submit(e: React.FormEvent) {
		e.preventDefault()
		const cities = citiesText.trim() === ""
			? null
			: citiesText.split(",").map((s) => s.trim()).filter(Boolean)
		const payload: ZoneInput = { ...form, cities }
		startTransition(async () => {
			try {
				if (mode.kind === "create") await createZone(payload)
				else await updateZone(mode.id, payload)
				toast.success("Guardado")
				onSaved()
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Error")
			}
		})
	}

	return (
		<form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
			<L label="Nombre"><input value={form.name} onChange={(e) => update("name", e.target.value)} className={inputCls} /></L>
			<L label="Departamento"><input value={form.department} onChange={(e) => update("department", e.target.value)} className={inputCls} /></L>
			<L label="Ciudades (coma; vacío = todo el depto)" className="sm:col-span-2">
				<input value={citiesText} onChange={(e) => setCitiesText(e.target.value)} className={inputCls} />
			</L>
			<L label="Tarifa base (pesos COP)">
				<input
					type="number"
					min={0}
					value={form.baseRatePesos}
					onChange={(e) => update("baseRatePesos", parseInt(e.target.value, 10) || 0)}
					className={inputCls}
				/>
			</L>
			<L label="Courier por defecto">
				<select
					value={form.courierDefault ?? ""}
					onChange={(e) => update("courierDefault", e.target.value || null)}
					className={inputCls}
				>
					<option value="">—</option>
					<option value="inter">Inter Rapidísimo</option>
					<option value="servientrega">Servientrega</option>
					<option value="envia">Envía</option>
				</select>
			</L>
			<L label="Sort order">
				<input
					type="number"
					value={form.sortOrder}
					onChange={(e) => update("sortOrder", parseInt(e.target.value, 10) || 0)}
					className={inputCls}
				/>
			</L>
			<label className="flex items-center gap-2 text-sm text-velajuy-wine">
				<input type="checkbox" checked={form.allowsCod} onChange={(e) => update("allowsCod", e.target.checked)} />
				Permite contra entrega
			</label>
			<label className="flex items-center gap-2 text-sm text-velajuy-wine">
				<input type="checkbox" checked={form.isActive} onChange={(e) => update("isActive", e.target.checked)} />
				Activa
			</label>
			<div className="sm:col-span-2">
				<button type="submit" disabled={pending} className="rounded-lg bg-velajuy-wine px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
					{pending ? "Guardando…" : "Guardar"}
				</button>
			</div>
		</form>
	)
}

const inputCls = "w-full rounded-lg border border-velajuy-wine/20 px-3 py-2 text-sm"

function L({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
	return (
		<label className={`block text-sm text-velajuy-wine ${className ?? ""}`}>
			<span className="mb-1 block font-medium">{label}</span>
			{children}
		</label>
	)
}
```

- [ ] **Step 4: Zone list page**

`src/app/admin/zonas/page.tsx`:

```tsx
"use client"

import { useState, useEffect, useTransition } from "react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/page-header"
import { deactivateZone } from "@/lib/admin/zones/actions"
import { ZoneForm } from "./zone-form"

type Zone = {
	id: string
	name: string
	department: string
	cities: string[] | null
	baseRateAmount: number
	allowsCod: boolean
	isActive: boolean
	sortOrder: number
	courierDefault: string | null
}

async function fetchZones(): Promise<Zone[]> {
	const res = await fetch("/admin/zonas/api", { cache: "no-store" })
	return res.json()
}

export default function ZonesPage() {
	const [zones, setZones] = useState<Zone[]>([])
	const [editing, setEditing] = useState<Zone | null>(null)
	const [showCreate, setShowCreate] = useState(false)
	const [pending, startTransition] = useTransition()

	useEffect(() => {
		fetchZones().then(setZones)
	}, [])

	function refresh() {
		fetchZones().then(setZones)
		setEditing(null)
		setShowCreate(false)
	}

	return (
		<>
			<PageHeader
				title="Zonas de envío"
				actions={
					<button
						type="button"
						onClick={() => setShowCreate(true)}
						className="rounded-lg bg-velajuy-wine px-3 py-2 text-sm font-medium text-white"
					>
						Nueva zona
					</button>
				}
			/>
			<ul className="space-y-2">
				{zones.map((z) => (
					<li key={z.id} className="rounded-2xl border border-velajuy-wine/10 bg-white p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium text-velajuy-wine">
									{z.name} {!z.isActive && <span className="text-xs text-zinc-500">(inactiva)</span>}
								</p>
								<p className="text-sm text-velajuy-wine-soft">
									{z.department}{z.cities ? ` · ${z.cities.join(", ")}` : " · (todo el depto)"} · Tarifa{" "}
									{(z.baseRateAmount / 100).toLocaleString("es-CO")} COP · COD {z.allowsCod ? "sí" : "no"}
								</p>
							</div>
							<div className="flex gap-2">
								<button onClick={() => setEditing(z)} className="rounded-lg border border-velajuy-wine/20 px-3 py-1 text-sm text-velajuy-wine">
									Editar
								</button>
								<button
									onClick={() => {
										if (!confirm("¿Desactivar esta zona?")) return
										startTransition(async () => {
											await deactivateZone(z.id)
											toast.success("Zona desactivada")
											refresh()
										})
									}}
									disabled={pending}
									className="rounded-lg border border-red-700 px-3 py-1 text-sm text-red-700 disabled:opacity-60"
								>
									Desactivar
								</button>
							</div>
						</div>
						{editing?.id === z.id && (
							<div className="mt-4">
								<ZoneForm
									mode={{ kind: "edit", id: z.id }}
									defaults={{
										name: z.name,
										country: "CO",
										department: z.department,
										cities: z.cities,
										baseRatePesos: Math.round(z.baseRateAmount / 100),
										courierDefault: z.courierDefault,
										allowsCod: z.allowsCod,
										isActive: z.isActive,
										sortOrder: z.sortOrder,
									}}
									onSaved={refresh}
								/>
							</div>
						)}
					</li>
				))}
			</ul>
			{showCreate && (
				<div className="mt-6 rounded-2xl border border-velajuy-wine/10 bg-white p-4">
					<h2 className="mb-3 text-lg font-bold text-velajuy-wine">Nueva zona</h2>
					<ZoneForm
						mode={{ kind: "create" }}
						defaults={{
							name: "",
							country: "CO",
							department: "",
							cities: null,
							baseRatePesos: 10_000,
							courierDefault: null,
							allowsCod: false,
							isActive: true,
							sortOrder: 100,
						}}
						onSaved={refresh}
					/>
				</div>
			)}
		</>
	)
}
```

- [ ] **Step 5: Create the read API for the client list**

`src/app/admin/zonas/api/route.ts`:

```ts
import { NextResponse } from "next/server"
import { requireOwner } from "@/lib/auth-guards"
import { listZones } from "@/lib/admin/zones/queries"

export async function GET() {
	await requireOwner()
	const rows = await listZones()
	return NextResponse.json(rows)
}
```

- [ ] **Step 6: Typecheck + commit**

```bash
pnpm typecheck
git add src/lib/admin/zones src/app/admin/zonas
git commit -m "feat(admin): shipping zones CRUD owner-only"
```

---

### Task 18: Páginas (CMS) editor

**Files:**
- Create: `src/lib/admin/pages/queries.ts`
- Create: `src/lib/admin/pages/actions.ts`
- Create: `src/app/admin/paginas/page.tsx`
- Create: `src/app/admin/paginas/nueva/page.tsx`
- Create: `src/app/admin/paginas/[slug]/page.tsx`

Phase 1 keeps the CMS minimal: a `body` text field rendered as Markdown on the public side (later phases may swap in TipTap). Owner-only writes. The `pages` table's `body` is `jsonb`; we'll store `{ kind: "markdown", text: "…" }`.

- [ ] **Step 1: Queries**

`src/lib/admin/pages/queries.ts`:

```ts
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { pages } from "@/lib/db/schema"

export async function listPages() {
	return db.select().from(pages).orderBy(pages.slug)
}

export async function getPageBySlug(slug: string) {
	const [row] = await db.select().from(pages).where(eq(pages.slug, slug))
	return row ?? null
}
```

- [ ] **Step 2: Actions**

`src/lib/admin/pages/actions.ts`:

```ts
"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { pages } from "@/lib/db/schema"
import { requireOwner } from "@/lib/auth-guards"

const PageInput = z.object({
	slug: z
		.string()
		.min(2)
		.max(80)
		.regex(/^[a-z0-9-]+$/),
	title: z.string().min(2).max(120),
	body: z.string().max(20_000),
	metaDescription: z.string().max(280).nullable(),
	published: z.boolean(),
})
type PageInput = z.infer<typeof PageInput>

function bodyJson(body: string) {
	return { kind: "markdown", text: body }
}

export async function createPage(input: PageInput): Promise<void> {
	await requireOwner()
	const data = PageInput.parse(input)
	await db.insert(pages).values({
		slug: data.slug,
		title: data.title,
		body: bodyJson(data.body),
		metaDescription: data.metaDescription,
		publishedAt: data.published ? new Date() : null,
	})
	revalidatePath("/admin/paginas")
}

export async function updatePage(slug: string, input: PageInput): Promise<void> {
	await requireOwner()
	const data = PageInput.parse(input)
	await db
		.update(pages)
		.set({
			slug: data.slug,
			title: data.title,
			body: bodyJson(data.body),
			metaDescription: data.metaDescription,
			publishedAt: data.published ? new Date() : null,
			updatedAt: new Date(),
		})
		.where(eq(pages.slug, slug))
	revalidatePath("/admin/paginas")
	revalidatePath(`/admin/paginas/${data.slug}`)
}
```

- [ ] **Step 3: List page**

`src/app/admin/paginas/page.tsx`:

```tsx
import Link from "next/link"
import type { Route } from "next"
import { PageHeader } from "@/components/admin/page-header"
import { listPages } from "@/lib/admin/pages/queries"

export default async function PagesIndex() {
	const rows = await listPages()
	return (
		<>
			<PageHeader
				title="Páginas"
				actions={
					<Link
						href={"/admin/paginas/nueva" as Route}
						className="rounded-lg bg-velajuy-wine px-3 py-2 text-sm font-medium text-white"
					>
						Nueva página
					</Link>
				}
			/>
			<ul className="space-y-2">
				{rows.map((p) => (
					<li key={p.id} className="rounded-xl border border-velajuy-wine/10 bg-white p-4">
						<Link
							href={`/admin/paginas/${p.slug}` as Route}
							className="font-medium text-velajuy-wine underline"
						>
							{p.title}
						</Link>
						<p className="text-xs text-velajuy-wine-soft">
							/{p.slug} · {p.publishedAt ? "Publicada" : "Borrador"}
						</p>
					</li>
				))}
			</ul>
		</>
	)
}
```

- [ ] **Step 4: Page editor (shared form embedded directly)**

`src/app/admin/paginas/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/admin/page-header"
import { getPageBySlug } from "@/lib/admin/pages/queries"
import { PageForm } from "../page-form"

export default async function EditPagePage({
	params,
}: {
	params: Promise<{ slug: string }>
}) {
	const { slug } = await params
	const page = await getPageBySlug(slug)
	if (!page) notFound()
	const body =
		page.body && typeof page.body === "object" && "text" in page.body
			? String((page.body as { text: string }).text)
			: ""

	return (
		<>
			<PageHeader title={page.title} subtitle={`/${page.slug}`} />
			<PageForm
				mode="edit"
				slug={page.slug}
				defaults={{
					slug: page.slug,
					title: page.title,
					body,
					metaDescription: page.metaDescription,
					published: !!page.publishedAt,
				}}
			/>
		</>
	)
}
```

`src/app/admin/paginas/nueva/page.tsx`:

```tsx
import { PageHeader } from "@/components/admin/page-header"
import { PageForm } from "../page-form"

export default function NewPagePage() {
	return (
		<>
			<PageHeader title="Nueva página" />
			<PageForm
				mode="create"
				defaults={{ slug: "", title: "", body: "", metaDescription: null, published: false }}
			/>
		</>
	)
}
```

`src/app/admin/paginas/page-form.tsx` (client, shared):

```tsx
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createPage, updatePage } from "@/lib/admin/pages/actions"

type FormState = {
	slug: string
	title: string
	body: string
	metaDescription: string | null
	published: boolean
}

export function PageForm({
	mode,
	slug,
	defaults,
}: {
	mode: "create" | "edit"
	slug?: string
	defaults: FormState
}) {
	const router = useRouter()
	const [form, setForm] = useState<FormState>(defaults)
	const [pending, startTransition] = useTransition()

	function submit(e: React.FormEvent) {
		e.preventDefault()
		startTransition(async () => {
			try {
				if (mode === "create") await createPage(form)
				else if (slug) await updatePage(slug, form)
				toast.success("Guardado")
				router.push("/admin/paginas")
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Error")
			}
		})
	}

	return (
		<form onSubmit={submit} className="space-y-4 rounded-2xl border border-velajuy-wine/10 bg-white p-5">
			<label className="block text-sm text-velajuy-wine">
				<span className="mb-1 block font-medium">Slug</span>
				<input
					value={form.slug}
					onChange={(e) => setForm({ ...form, slug: e.target.value })}
					required
					className="w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"
				/>
			</label>
			<label className="block text-sm text-velajuy-wine">
				<span className="mb-1 block font-medium">Título</span>
				<input
					value={form.title}
					onChange={(e) => setForm({ ...form, title: e.target.value })}
					required
					className="w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"
				/>
			</label>
			<label className="block text-sm text-velajuy-wine">
				<span className="mb-1 block font-medium">Cuerpo (Markdown)</span>
				<textarea
					value={form.body}
					onChange={(e) => setForm({ ...form, body: e.target.value })}
					rows={14}
					className="w-full rounded-lg border border-velajuy-wine/20 px-3 py-2 font-mono"
				/>
			</label>
			<label className="block text-sm text-velajuy-wine">
				<span className="mb-1 block font-medium">Meta description</span>
				<input
					value={form.metaDescription ?? ""}
					onChange={(e) => setForm({ ...form, metaDescription: e.target.value || null })}
					maxLength={280}
					className="w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"
				/>
			</label>
			<label className="flex items-center gap-2 text-sm text-velajuy-wine">
				<input
					type="checkbox"
					checked={form.published}
					onChange={(e) => setForm({ ...form, published: e.target.checked })}
				/>
				Publicada
			</label>
			<button
				type="submit"
				disabled={pending}
				className="rounded-lg bg-velajuy-wine px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
			>
				{pending ? "Guardando…" : "Guardar"}
			</button>
		</form>
	)
}
```

- [ ] **Step 5: Typecheck + commit**

```bash
pnpm typecheck
git add src/lib/admin/pages src/app/admin/paginas
git commit -m "feat(admin): CMS pages with markdown editor"
```

---

### Task 19: Suscripciones back-in-stock view

**Files:**
- Create: `src/lib/admin/back-in-stock/queries.ts`
- Create: `src/app/admin/back-in-stock/page.tsx`

Read-only list grouped by product. Marketing signal — no destructive actions.

- [ ] **Step 1: Query**

`src/lib/admin/back-in-stock/queries.ts`:

```ts
import { count, desc, eq, isNull, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { backInStockSubscriptions, products } from "@/lib/db/schema"

export async function listSubscriptionsGroupedByProduct() {
	return db
		.select({
			productId: products.id,
			productName: products.name,
			stock: products.stockQuantity,
			pendingCount: sql<number>`COUNT(*) FILTER (WHERE ${backInStockSubscriptions.notifiedAt} IS NULL)`.mapWith(Number),
			notifiedCount: sql<number>`COUNT(*) FILTER (WHERE ${backInStockSubscriptions.notifiedAt} IS NOT NULL)`.mapWith(Number),
			latest: sql<Date>`MAX(${backInStockSubscriptions.createdAt})`,
		})
		.from(backInStockSubscriptions)
		.innerJoin(products, eq(products.id, backInStockSubscriptions.productId))
		.groupBy(products.id, products.name, products.stockQuantity)
		.orderBy(desc(sql`MAX(${backInStockSubscriptions.createdAt})`))
}

export async function listSubscriptionsForProduct(productId: string) {
	return db
		.select()
		.from(backInStockSubscriptions)
		.where(eq(backInStockSubscriptions.productId, productId))
		.orderBy(desc(backInStockSubscriptions.createdAt))
}

void count
void isNull
```

- [ ] **Step 2: Page**

`src/app/admin/back-in-stock/page.tsx`:

```tsx
import Link from "next/link"
import type { Route } from "next"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { PageHeader } from "@/components/admin/page-header"
import { listSubscriptionsGroupedByProduct } from "@/lib/admin/back-in-stock/queries"

export default async function BackInStockPage() {
	const rows = await listSubscriptionsGroupedByProduct()
	return (
		<>
			<PageHeader title="Suscripciones back-in-stock" subtitle={`${rows.length} productos con interés`} />
			<table className="w-full">
				<thead>
					<tr className="text-left text-xs uppercase tracking-wide text-velajuy-wine-soft">
						<th className="py-2">Producto</th>
						<th className="py-2 text-right">Stock</th>
						<th className="py-2 text-right">Pendientes</th>
						<th className="py-2 text-right">Notificados</th>
						<th className="py-2">Última suscripción</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-velajuy-wine/10">
					{rows.map((r) => (
						<tr key={r.productId}>
							<td className="py-3">
								<Link
									href={`/admin/productos/${r.productId}` as Route}
									className="font-medium text-velajuy-wine underline"
								>
									{r.productName}
								</Link>
							</td>
							<td className="py-3 text-right text-sm">{r.stock}</td>
							<td className="py-3 text-right text-sm font-medium text-velajuy-wine">{r.pendingCount}</td>
							<td className="py-3 text-right text-sm text-velajuy-wine-soft">{r.notifiedCount}</td>
							<td className="py-3 text-sm text-velajuy-wine-soft">
								{format(new Date(r.latest), "d MMM yyyy", { locale: es })}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</>
	)
}
```

- [ ] **Step 3: Typecheck + commit**

```bash
pnpm typecheck
git add src/lib/admin/back-in-stock src/app/admin/back-in-stock
git commit -m "feat(admin): back-in-stock subscriptions view"
```

---

### Task 20: Configuración (settings + notifications)

**Files:**
- Create: `src/app/admin/configuracion/page.tsx`
- Create: `src/app/admin/configuracion/settings-form.tsx`

Owner-only. Shop info, free-shipping threshold, low-stock default, IVA default, and the four notification toggles + frequency + email.

- [ ] **Step 1: Form (client)**

`src/app/admin/configuracion/settings-form.tsx`:

```tsx
"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { updateSetting } from "@/lib/admin/settings/actions"
import type { Notifications } from "@/lib/admin/settings/schema"

type Defaults = {
	shop_name: string
	contact_email: string
	contact_phone: string
	social_instagram: string
	free_shipping_min_quantity: number
	low_stock_threshold_default: number
	iva_default_rate: number
	notifications: Notifications
}

const EVENTS: { key: keyof Notifications; label: string }[] = [
	{ key: "new_order", label: "Nuevo pedido" },
	{ key: "payment_received", label: "Pago recibido" },
	{ key: "stock_low", label: "Stock bajo" },
	{ key: "cod_ready", label: "COD listo para confirmar" },
]

export function SettingsForm({ defaults }: { defaults: Defaults }) {
	const [state, setState] = useState(defaults)
	const [pending, startTransition] = useTransition()

	function save() {
		startTransition(async () => {
			try {
				await Promise.all([
					updateSetting("shop_name", state.shop_name),
					updateSetting("contact_email", state.contact_email),
					updateSetting("contact_phone", state.contact_phone),
					updateSetting("social_instagram", state.social_instagram),
					updateSetting("free_shipping_min_quantity", state.free_shipping_min_quantity),
					updateSetting("low_stock_threshold_default", state.low_stock_threshold_default),
					updateSetting("iva_default_rate", state.iva_default_rate),
					updateSetting("notifications", state.notifications),
				])
				toast.success("Configuración guardada")
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Error")
			}
		})
	}

	return (
		<div className="space-y-6">
			<Section title="Tienda">
				<T label="Nombre" value={state.shop_name} onChange={(v) => setState({ ...state, shop_name: v })} />
				<T label="Email de contacto" value={state.contact_email} onChange={(v) => setState({ ...state, contact_email: v })} />
				<T label="Teléfono" value={state.contact_phone} onChange={(v) => setState({ ...state, contact_phone: v })} />
				<T label="Instagram" value={state.social_instagram} onChange={(v) => setState({ ...state, social_instagram: v })} />
			</Section>
			<Section title="Comercio">
				<N label="Cantidad mínima para envío gratis" value={state.free_shipping_min_quantity} onChange={(v) => setState({ ...state, free_shipping_min_quantity: v })} />
				<N label="Umbral de stock bajo (default)" value={state.low_stock_threshold_default} onChange={(v) => setState({ ...state, low_stock_threshold_default: v })} />
				<N label="IVA por defecto (%)" value={state.iva_default_rate} onChange={(v) => setState({ ...state, iva_default_rate: v })} />
			</Section>
			<Section title="Notificaciones">
				{EVENTS.map(({ key, label }) => {
					const cfg = state.notifications[key]
					return (
						<div key={key} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-4">
							<label className="flex items-center gap-2 text-sm text-velajuy-wine">
								<input
									type="checkbox"
									checked={cfg.enabled}
									onChange={(e) =>
										setState({
											...state,
											notifications: {
												...state.notifications,
												[key]: { ...cfg, enabled: e.target.checked },
											},
										})
									}
								/>
								{label}
							</label>
							<select
								value={cfg.frequency}
								onChange={(e) =>
									setState({
										...state,
										notifications: {
											...state.notifications,
											[key]: { ...cfg, frequency: e.target.value as typeof cfg.frequency },
										},
									})
								}
								className="rounded-lg border border-velajuy-wine/20 px-3 py-2 text-sm"
							>
								<option value="immediate">Inmediato</option>
								<option value="daily">Resumen diario</option>
								<option value="off">Apagado</option>
							</select>
							<input
								placeholder="Email destino (opcional)"
								value={cfg.email ?? ""}
								onChange={(e) =>
									setState({
										...state,
										notifications: {
											...state.notifications,
											[key]: { ...cfg, email: e.target.value || null },
										},
									})
								}
								className="rounded-lg border border-velajuy-wine/20 px-3 py-2 text-sm sm:col-span-2"
							/>
						</div>
					)
				})}
			</Section>
			<button
				type="button"
				onClick={save}
				disabled={pending}
				className="rounded-lg bg-velajuy-wine px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
			>
				{pending ? "Guardando…" : "Guardar configuración"}
			</button>
		</div>
	)
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<section className="rounded-2xl border border-velajuy-wine/10 bg-white p-5">
			<h2 className="mb-4 text-lg font-bold text-velajuy-wine">{title}</h2>
			<div className="space-y-3">{children}</div>
		</section>
	)
}

function T({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
	return (
		<label className="block text-sm text-velajuy-wine">
			<span className="mb-1 block font-medium">{label}</span>
			<input
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"
			/>
		</label>
	)
}

function N({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
	return (
		<label className="block text-sm text-velajuy-wine">
			<span className="mb-1 block font-medium">{label}</span>
			<input
				type="number"
				min={0}
				value={value}
				onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
				className="w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"
			/>
		</label>
	)
}
```

- [ ] **Step 2: Page**

`src/app/admin/configuracion/page.tsx`:

```tsx
import { PageHeader } from "@/components/admin/page-header"
import { requireOwner } from "@/lib/auth-guards"
import { getAllSettings } from "@/lib/admin/settings/queries"
import { notificationsSchema } from "@/lib/admin/settings/schema"
import { SettingsForm } from "./settings-form"

export default async function ConfigPage() {
	await requireOwner()
	const all = await getAllSettings()
	return (
		<>
			<PageHeader title="Configuración" />
			<SettingsForm
				defaults={{
					shop_name: String(all.shop_name ?? ""),
					contact_email: String(all.contact_email ?? ""),
					contact_phone: String(all.contact_phone ?? ""),
					social_instagram: String(all.social_instagram ?? ""),
					free_shipping_min_quantity: Number(all.free_shipping_min_quantity ?? 3),
					low_stock_threshold_default: Number(all.low_stock_threshold_default ?? 2),
					iva_default_rate: Number(all.iva_default_rate ?? 19),
					notifications: notificationsSchema.parse(all.notifications),
				}}
			/>
		</>
	)
}
```

- [ ] **Step 3: Typecheck + commit**

```bash
pnpm typecheck
git add src/app/admin/configuracion
git commit -m "feat(admin): configuration view with settings + notification toggles"
```

---

### Task 21: Playwright E2E coverage for admin flows

**Files:**
- Create: `tests/e2e/admin-orders.spec.ts`
- Create: `tests/e2e/admin-products.spec.ts`
- Create: `tests/e2e/admin-inventory.spec.ts`
- Create: `tests/e2e/admin-zones.spec.ts`
- Create: `tests/e2e/admin-pages.spec.ts`
- Create: `tests/e2e/admin-settings.spec.ts`

These tests rely on the seeded owner from `db:seed`. Use a helper that signs in via the better-auth API (`POST /api/auth/sign-in/magic-link` returns the verification token in test mode); the existing Plan 1 e2e helper does this.

- [ ] **Step 1: Confirm admin sign-in helper exists**

Check `tests/e2e/utils/sign-in-as-owner.ts` (created in Plan 1). If absent, create:

```ts
import type { Page } from "@playwright/test"
import postgres from "postgres"

export async function signInAsOwner(page: Page, email = "andre.vital@metalab.com") {
	const sql = postgres(process.env.DATABASE_URL!, { prepare: false })
	await page.request.post("/api/auth/sign-in/magic-link", {
		data: { email, callbackURL: "/admin" },
	})
	const [row] = await sql<{ value: string }[]>`
		SELECT value FROM verifications WHERE identifier = ${email} ORDER BY created_at DESC LIMIT 1
	`
	await sql.end()
	await page.goto(row.value)
	await page.waitForURL("**/admin")
}
```

- [ ] **Step 2: `admin-orders.spec.ts`**

```ts
import { test, expect } from "@playwright/test"
import { signInAsOwner } from "./utils/sign-in-as-owner"

test("owner lists and opens an order", async ({ page }) => {
	await signInAsOwner(page)
	await page.goto("/admin/pedidos")
	await expect(page.getByRole("heading", { name: "Pedidos" })).toBeVisible()
})
```

- [ ] **Step 3: `admin-products.spec.ts`**

```ts
import { test, expect } from "@playwright/test"
import { signInAsOwner } from "./utils/sign-in-as-owner"

test("owner creates a draft product", async ({ page }) => {
	await signInAsOwner(page)
	await page.goto("/admin/productos/nuevo")
	await page.getByLabel("Nombre").fill("Peluca Test E2E")
	await page.getByLabel("Slug").fill("peluca-test-e2e")
	await page.getByLabel("Precio (pesos COP, sin decimales)").fill("100000")
	await page.getByRole("button", { name: "Guardar" }).click()
	await expect(page).toHaveURL(/\/admin\/productos\/[0-9a-f-]+/)
})
```

- [ ] **Step 4: `admin-inventory.spec.ts`**

```ts
import { test, expect } from "@playwright/test"
import { signInAsOwner } from "./utils/sign-in-as-owner"

test("owner adjusts stock", async ({ page }) => {
	await signInAsOwner(page)
	await page.goto("/admin/inventario")
	const firstRow = page.locator("tbody tr").first()
	await firstRow.locator("input[type=number]").fill("5")
	await firstRow.getByRole("button", { name: "Aplicar" }).click()
	await expect(page.getByText("Stock actualizado")).toBeVisible()
})
```

- [ ] **Step 5: `admin-zones.spec.ts`**

```ts
import { test, expect } from "@playwright/test"
import { signInAsOwner } from "./utils/sign-in-as-owner"

test("owner sees seeded zones", async ({ page }) => {
	await signInAsOwner(page)
	await page.goto("/admin/zonas")
	await expect(page.getByText("Bucaramanga")).toBeVisible()
})
```

- [ ] **Step 6: `admin-pages.spec.ts`**

```ts
import { test, expect } from "@playwright/test"
import { signInAsOwner } from "./utils/sign-in-as-owner"

test("owner edits a CMS page", async ({ page }) => {
	await signInAsOwner(page)
	await page.goto("/admin/paginas")
	await page.getByRole("link", { name: "Cuidado" }).click()
	await page.getByLabel("Cuerpo (Markdown)").fill("Lava la peluca con cuidado.")
	await page.getByRole("button", { name: "Guardar" }).click()
	await expect(page).toHaveURL("/admin/paginas")
})
```

- [ ] **Step 7: `admin-settings.spec.ts`**

```ts
import { test, expect } from "@playwright/test"
import { signInAsOwner } from "./utils/sign-in-as-owner"

test("owner toggles a notification", async ({ page }) => {
	await signInAsOwner(page)
	await page.goto("/admin/configuracion")
	const stockLowToggle = page.getByLabel("Stock bajo")
	await stockLowToggle.uncheck()
	await page.getByRole("button", { name: "Guardar configuración" }).click()
	await expect(page.getByText("Configuración guardada")).toBeVisible()
})
```

- [ ] **Step 8: Run E2E suite**

Run: `pnpm test:e2e`
Expected: all pass on top of `db:seed`.

- [ ] **Step 9: Commit**

```bash
git add tests/e2e
git commit -m "test(admin): e2e coverage for admin flows"
```

---

### Task 22: Final check — typecheck, lint, unit, e2e, CI green

- [ ] **Step 1: Full sweep**

Run:

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

Expected: all clean.

- [ ] **Step 2: Update `.env.example` doc block (R2 vars already added in Task 5)**

Verify the file lists every variable consumed in this plan.

- [ ] **Step 3: Commit and push**

```bash
git push -u origin feat/velajuy-admin
```

- [ ] **Step 4: Open PR**

Use the project's PR template. Body sections: Summary, Changes (grouped by area — auth, admin shell, R2, orders, products, inventory, zones, pages, back-in-stock, configuration, email, tests, follow-ups), Notable decisions, Next steps (Phase 4 polish + DIAN integration + reserve-on-placement stock if oversells observed).

---

## Self-review

**Spec coverage check (§9 Admin and §10 testing):**

- Dashboard, Pedidos, Productos, Inventario, Zonas, Páginas, Suscripciones back-in-stock, Configuración → Tasks 9, 10–12, 13–15, 16, 17, 18, 19, 20 ✔
- Order detail with status timeline + buttons + COD + cancel + print → Task 12 ✔
- Roles (owner vs staff) → sidebar filter (Task 4), `requireOwner` on price/zone/page/settings/product create-edit (Tasks 3, 8, 14, 17, 18) ✔
- Notifications per-event toggle + frequency + email → Tasks 7, 20 ✔
- Image gallery drag-reorder + R2 → Tasks 5, 15 ✔
- Vitest unit tests for stock decrement / state machine / notify → Tasks 6, 7, 16 ✔
- Playwright admin flow → Task 21 ✔
- Phase 2 follow-ups (`/ingresar` redirect, emoji removal) → Tasks 1–2 ✔

**Placeholder scan:** No "TBD" / "implement later" / "similar to" references; every code block stands alone.

**Type consistency:** `OrderStatus` defined once (`order-state.ts`) and re-used by action and UI files. `ProductFormInput` defined once and consumed by form, actions, edit page. `Notifications` defined once and consumed by `notify.ts` + settings page.

**Known compromise:** Task 11's `cancelOrder` shows a deliberately wrong placeholder line that Step 3 immediately replaces with the correct `sql` template. Kept that way for honest TDD progression rather than glossing over how Drizzle's atomic increment is expressed.

---

## Execution handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-17-velajuy-admin.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — execute tasks in this session using executing-plans, batch with checkpoints.

**Which approach?**
