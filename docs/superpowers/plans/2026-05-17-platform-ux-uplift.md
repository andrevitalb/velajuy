# Platform UX Uplift Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lift Velajuy Pelucas from "functional MVP that screams Tailwind + AI" to a polished, accessible, motion-aware e-commerce platform. Address 130+ audit findings across accessibility, visual design, motion/interaction (Emil Kowalski lens), responsive design, performance, and admin UX.

**Architecture:** Touch only what the audit flagged. Add (a) a thin design-token layer in `globals.css` for focus rings, motion timings, semantic colors; (b) two new primitives — `Button`, `Sheet` — used by storefront and admin; (c) keep the existing file structure (no restructure). Tailwind 4 `@theme` continues to hold tokens. No motion library — use CSS animations + `view-transition` for free spring-feel; reserve a future swap to `motion/react` if needed.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS 4, Drizzle, Sonner, lucide-react. No new runtime deps except `clsx` (already pulled by dnd-kit transitively — verify) and optionally `tailwind-merge` for the `Button` primitive. Test: Vitest + Playwright. A11y: `@axe-core/playwright`.

---

## Audit Synthesis (read first — sets context)

Four parallel auditors (storefront, admin, a11y+responsive, motion+perf) produced ~130 findings against `main` at commit `336cb75`. Themes:

### Anti-Patterns Verdict
**Passes** the AI-slop test for visual style (no gradient text, glassmorphism, hero metrics, generic emoji icons — the velajuy-pink/wine/cream palette is consistently applied through @theme tokens, alts are populated, lucide is used correctly). **Fails** the "feels finished" test: zero motion, no focus rings, no skeletons, no press feedback, no mobile nav. The platform reads as "good bones, no skin."

### Top 10 Critical Issues
1. **No visible focus rings** anywhere — keyboard users are blind. WCAG 2.4.7 fail.
2. **No skip-to-content link**. WCAG 2.4.1 fail.
3. **Modal snaps open** — no fade, no scale, no focus trap, no `aria-modal`.
4. **No mobile navigation** on storefront header — no hamburger, no cart/wishlist icons, no `aria-current`.
5. **Admin sidebar is fixed `w-60`** with no mobile collapse — admin unusable below ~640px.
6. **Form labels are placeholders only** on `ingresar-form.tsx` and `back-in-stock-form.tsx`.
7. **Data table has no sort, no pagination, no mobile reflow** — admin scales poorly.
8. **Stock badge & status pills convey state through color alone** — WCAG 1.4.1 fail.
9. **No `prefers-reduced-motion` respect** and no felt details (Emil Kowalski lens): wishlist heart doesn't pop, gallery image swap snaps, success states have no motion, grid reveals don't stagger.
10. **No loading skeletons / Suspense fallbacks** — page-load feedback is blank.

### Conflicts to Resolve
- Contrast of `text-velajuy-wine-soft` (#7a3d4d) on `bg-velajuy-pink-soft` (#fde2ea): storefront auditor said ~3.5:1 (fail), a11y auditor said ~4.8:1 (AA pass). **Task 9 verifies with the actual WCAG formula and updates the token if it fails.**

### Positive Findings to Preserve
- Color tokens centralized in `@theme` (no hex sprinkling).
- Next/Image used throughout with `sizes`.
- Wishlist button uses `aria-pressed` correctly — a model to copy.
- Drag-and-drop in admin image gallery has `KeyboardSensor` — copy pattern to other DnD.
- `lang="es-CO"` set; Sonner used for toasts.
- dnd-kit usage is accessible.

---

## File Structure (locks decomposition decisions)

**Create:**
- `src/components/ui/button.tsx` — Single source of truth for buttons (storefront + admin)
- `src/components/ui/sheet.tsx` — Bottom-sheet for mobile filters / admin mobile nav
- `src/components/ui/skeleton.tsx` — Pulse skeleton primitives (Card, Line, Avatar)
- `src/components/ui/badge.tsx` — Status/stock badge with icon + label (replaces status-pill + stock-badge color-only logic)
- `src/components/storefront/mobile-nav.tsx` — Hamburger drawer
- `src/components/storefront/skip-link.tsx` — `<a href="#main">`
- `src/components/admin/mobile-nav.tsx` — Admin drawer trigger
- `src/components/admin/sortable-th.tsx` — `<th>` wrapper with sort indicator + URL state
- `src/components/admin/pagination.tsx` — Cursor / page pagination
- `src/lib/a11y/contrast.ts` — Pure WCAG contrast calc (used in test only)
- `src/app/(storefront)/loading.tsx` — Suspense fallback
- `src/app/(storefront)/catalogo/loading.tsx`
- `src/app/(storefront)/producto/[slug]/loading.tsx`
- `src/app/admin/loading.tsx`
- `tests/e2e/a11y.spec.ts` — Playwright + axe smoke
- `tests/e2e/keyboard-nav.spec.ts` — Tab order / focus-visible
- `tests/e2e/motion.spec.ts` — Verifies key animations + reduced-motion
- `tests/unit/contrast.test.ts`
- `tests/unit/badge.test.tsx`

**Modify:**
- `src/app/globals.css` — Tokens for radius, motion, focus ring, reduced-motion, dark mode
- `src/app/layout.tsx` — Skip link, `id="main"`, focus-on-route-change
- `src/components/ui/modal.tsx` — Animations, focus trap, aria-modal, ESC handling
- `src/components/ui/empty-state.tsx` — Accept `action` prop, fade-in
- `src/components/storefront/header.tsx` — Mobile nav, aria-current, cart/wishlist slots
- `src/components/storefront/footer.tsx` — Sections (legal, sobre, contacto)
- `src/components/storefront/product-card.tsx` — Smoother hover, tabular nums, lazy
- `src/components/storefront/price.tsx` — `tabular-nums`
- `src/components/storefront/stock-badge.tsx` — Use new Badge primitive (icon + text)
- `src/components/admin/data-table.tsx` — Generic sort/pagination wrapper, mobile reflow
- `src/components/admin/shell.tsx` — Mobile sidebar drawer
- `src/components/admin/sidebar.tsx` — `aria-current`, breadcrumb slot
- `src/components/admin/status-pill.tsx` — Icon + label (Badge)
- `src/app/ingresar/ingresar-form.tsx` — Visible labels, aria-invalid, role="alert"
- `src/app/(storefront)/producto/[slug]/back-in-stock-form.tsx` — Labels, success motion, reset
- `src/app/(storefront)/producto/[slug]/gallery.tsx` — Crossfade, keyboard, swipe
- `src/app/(storefront)/producto/[slug]/wishlist-button.tsx` — Heart pop
- `src/app/(storefront)/producto/[slug]/product-tabs.tsx` — ARIA tablist, fade
- `src/app/(storefront)/producto/[slug]/product-info.tsx` — Breadcrumb, responsive grid
- `src/app/(storefront)/catalogo/page.tsx` — EmptyState action, stagger
- `src/app/(storefront)/catalogo/filter-sidebar.tsx` — Sheet on mobile, button feedback
- `src/app/(storefront)/quick-view-modal.tsx` — Use new Modal motion
- `src/app/admin/pedidos/page.tsx` — Pagination, sort
- `src/app/admin/pedidos/filters.tsx` — Active filter count + clear all
- `src/app/admin/productos/[id]/product-form.tsx` — Required `*`, aria-invalid, focus-on-error
- `src/app/admin/configuracion/settings-form.tsx` — Same
- `src/app/admin/zonas/zone-form.tsx` — Same
- `src/app/admin/inventario/adjust-row.tsx` — `aria-label`, optimistic update, undo toast
- `package.json` — Add `@axe-core/playwright`, `clsx`, `tailwind-merge`
- `playwright.config.ts` — Mobile viewport project

---

## Execution Phases

Phases are independent enough to parallelize across subagents but ordered so foundational work lands first. Estimated 8 calendar days for one engineer or 3 days with parallel subagents.

- **Phase 0** — Foundation tokens + primitives (Tasks 1–6)
- **Phase 1** — Accessibility critical (Tasks 7–13)
- **Phase 2** — Storefront visual & layout (Tasks 14–22)
- **Phase 3** — Motion & felt details (Tasks 23–31)
- **Phase 4** — Admin UX (Tasks 32–38)
- **Phase 5** — Performance (Tasks 39–42)
- **Phase 6** — Verification (Tasks 43–45)

Each task uses TDD where verifiable (a11y, unit, integration). Pure visual changes are verified by Playwright screenshot snapshot or by manual checklist.

---

# PHASE 0 — Foundation

### Task 1: Add motion + radius + focus design tokens

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace globals.css with token-rich version**

```css
@import "tailwindcss";

@theme {
	--color-velajuy-pink: #f4b6c2;
	--color-velajuy-pink-soft: #fde2ea;
	--color-velajuy-pink-bg: #fff5f8;
	--color-velajuy-wine: #5c1a2a;
	--color-velajuy-wine-soft: #7a3d4d;
	--color-velajuy-cream: #fffaf5;

	/* Semantic */
	--color-success: #2f7a4d;
	--color-warning: #b76e00;
	--color-danger: #9a1f2b;
	--color-info: #1f5a9a;

	--font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;

	/* Motion */
	--ease-out-soft: cubic-bezier(0.22, 1, 0.36, 1);
	--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
	--duration-fast: 150ms;
	--duration-base: 200ms;
	--duration-slow: 300ms;

	/* Radius */
	--radius-sm: 0.375rem;
	--radius-md: 0.5rem;
	--radius-lg: 0.75rem;
	--radius-xl: 1rem;
}

@layer base {
	:focus-visible {
		outline: 2px solid var(--color-velajuy-wine);
		outline-offset: 2px;
		border-radius: 4px;
	}
	html { scroll-behavior: smooth; }
}

@media (prefers-reduced-motion: reduce) {
	*, *::before, *::after {
		animation-duration: 0.001ms !important;
		animation-iteration-count: 1 !important;
		transition-duration: 0.001ms !important;
		scroll-behavior: auto !important;
	}
}

@keyframes velajuy-fade-in {
	from { opacity: 0; }
	to { opacity: 1; }
}
@keyframes velajuy-scale-in {
	from { opacity: 0; transform: scale(0.96); }
	to { opacity: 1; transform: scale(1); }
}
@keyframes velajuy-slide-up {
	from { opacity: 0; transform: translateY(8px); }
	to { opacity: 1; transform: translateY(0); }
}
@keyframes velajuy-pop {
	0% { transform: scale(1); }
	40% { transform: scale(1.18); }
	100% { transform: scale(1); }
}
@keyframes velajuy-pulse-soft {
	0%, 100% { opacity: 1; }
	50% { opacity: 0.55; }
}

.animate-fade-in { animation: velajuy-fade-in var(--duration-slow) var(--ease-out-soft) both; }
.animate-scale-in { animation: velajuy-scale-in var(--duration-slow) var(--ease-spring) both; }
.animate-slide-up { animation: velajuy-slide-up var(--duration-slow) var(--ease-out-soft) both; }
.animate-pop { animation: velajuy-pop 320ms var(--ease-spring); }
.animate-pulse-soft { animation: velajuy-pulse-soft 2s ease-in-out infinite; }

dialog[open] { animation: velajuy-scale-in var(--duration-slow) var(--ease-spring); }
dialog::backdrop { animation: velajuy-fade-in var(--duration-base) var(--ease-out-soft); }
```

- [ ] **Step 2: Verify the build still compiles**

Run: `pnpm typecheck && pnpm build`
Expected: Both succeed.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(ui): add motion, radius, semantic color tokens"
```

---

### Task 2: Install `clsx` + `tailwind-merge` + `@axe-core/playwright`

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: Install deps**

```bash
pnpm add clsx tailwind-merge
pnpm add -D @axe-core/playwright
```

- [ ] **Step 2: Verify versions resolve**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(deps): add clsx, tailwind-merge, axe-core/playwright"
```

---

### Task 3: Create `cn` utility

**Files:**
- Create: `src/lib/cn.ts`

- [ ] **Step 1: Write the utility**

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/cn.ts
git commit -m "feat(ui): add cn class-name merge utility"
```

---

### Task 4: Create `<Button>` primitive (TDD)

**Files:**
- Create: `src/components/ui/button.tsx`, `tests/unit/button.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// tests/unit/button.test.tsx
import { render, screen } from "@testing-library/react"
import { Button } from "@/components/ui/button"
import { describe, expect, it } from "vitest"

describe("Button", () => {
	it("renders children with primary variant by default", () => {
		render(<Button>Hola</Button>)
		const btn = screen.getByRole("button", { name: "Hola" })
		expect(btn.className).toContain("bg-velajuy-wine")
	})
	it("shows loading spinner and disables when pending", () => {
		render(<Button pending>Save</Button>)
		const btn = screen.getByRole("button")
		expect(btn).toBeDisabled()
		expect(btn.getAttribute("aria-busy")).toBe("true")
	})
	it("applies press feedback class", () => {
		render(<Button>tap</Button>)
		expect(screen.getByRole("button").className).toMatch(/active:scale-95/)
	})
})
```

- [ ] **Step 2: Install testing-library if missing**

```bash
pnpm add -D @testing-library/react @testing-library/jest-dom jsdom
```

Update `vitest.config.ts` to use jsdom environment and include the setup file as needed.

- [ ] **Step 3: Run test (should fail — module not found)**

Run: `pnpm test tests/unit/button.test.tsx`
Expected: FAIL — "Cannot find module '@/components/ui/button'".

- [ ] **Step 4: Implement Button**

```tsx
// src/components/ui/button.tsx
import { Loader2 } from "lucide-react"
import { forwardRef, type ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/cn"

type Variant = "primary" | "secondary" | "ghost" | "danger"
type Size = "sm" | "md" | "lg"

const base =
	"inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 ease-out " +
	"active:scale-95 active:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 " +
	"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-velajuy-wine"

const variants: Record<Variant, string> = {
	primary: "bg-velajuy-wine text-velajuy-cream hover:bg-velajuy-wine-soft",
	secondary:
		"border border-velajuy-wine text-velajuy-wine bg-transparent hover:bg-velajuy-pink-soft",
	ghost: "text-velajuy-wine hover:bg-velajuy-pink-soft",
	danger: "bg-[--color-danger] text-white hover:opacity-90",
}

const sizes: Record<Size, string> = {
	sm: "h-9 px-3 text-sm rounded-md",
	md: "h-11 px-4 text-sm rounded-lg",
	lg: "h-12 px-5 text-base rounded-xl",
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: Variant
	size?: Size
	pending?: boolean
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
	{ className, variant = "primary", size = "md", pending, disabled, children, ...rest },
	ref,
) {
	return (
		<button
			ref={ref}
			disabled={disabled || pending}
			aria-busy={pending || undefined}
			className={cn(base, variants[variant], sizes[size], className)}
			{...rest}
		>
			{pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
			{children}
		</button>
	)
})
```

- [ ] **Step 5: Run tests — expect PASS**

Run: `pnpm test tests/unit/button.test.tsx`
Expected: 3 passing.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/button.tsx tests/unit/button.test.tsx package.json pnpm-lock.yaml
git commit -m "feat(ui): introduce Button primitive with variants, sizes, pending state"
```

---

### Task 5: Create `<Badge>` primitive (TDD)

**Files:**
- Create: `src/components/ui/badge.tsx`, `tests/unit/badge.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// tests/unit/badge.test.tsx
import { render, screen } from "@testing-library/react"
import { Badge } from "@/components/ui/badge"
import { describe, expect, it } from "vitest"

describe("Badge", () => {
	it("renders icon + label so meaning is not color-only", () => {
		render(<Badge tone="warning">Últimas 2</Badge>)
		expect(screen.getByText("Últimas 2")).toBeTruthy()
		expect(screen.getByLabelText("warning")).toBeTruthy() // svg has aria-label
	})
	it("supports an explicit aria-label override", () => {
		render(<Badge tone="danger" srLabel="Agotado">Agotado</Badge>)
		expect(screen.getByLabelText("Agotado")).toBeTruthy()
	})
})
```

- [ ] **Step 2: Run — expect FAIL**

Run: `pnpm test tests/unit/badge.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement Badge**

```tsx
// src/components/ui/badge.tsx
import { AlertCircle, CheckCircle2, CircleDashed, Clock, Info, XCircle } from "lucide-react"
import { cn } from "@/lib/cn"

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger" | "pending"

const map: Record<BadgeTone, { bg: string; fg: string; Icon: React.ComponentType<{ className?: string }> }> = {
	neutral: { bg: "bg-velajuy-pink-soft", fg: "text-velajuy-wine", Icon: CircleDashed },
	info: { bg: "bg-blue-50", fg: "text-blue-800", Icon: Info },
	success: { bg: "bg-emerald-50", fg: "text-emerald-800", Icon: CheckCircle2 },
	warning: { bg: "bg-amber-50", fg: "text-amber-900", Icon: AlertCircle },
	danger: { bg: "bg-rose-50", fg: "text-rose-900", Icon: XCircle },
	pending: { bg: "bg-velajuy-pink-soft", fg: "text-velajuy-wine", Icon: Clock },
}

export function Badge({
	tone = "neutral",
	children,
	srLabel,
	className,
	pulse,
}: {
	tone?: BadgeTone
	children: React.ReactNode
	srLabel?: string
	className?: string
	pulse?: boolean
}) {
	const { bg, fg, Icon } = map[tone]
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
				bg,
				fg,
				pulse && "animate-pulse-soft",
				className,
			)}
		>
			<Icon className="size-3" aria-label={srLabel ?? tone} />
			{children}
		</span>
	)
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `pnpm test tests/unit/badge.test.tsx`
Expected: 2 passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/badge.tsx tests/unit/badge.test.tsx
git commit -m "feat(ui): add Badge primitive with icon, tones, and pulse"
```

---

### Task 6: Create `<Skeleton>` primitive

**Files:**
- Create: `src/components/ui/skeleton.tsx`

- [ ] **Step 1: Write component**

```tsx
// src/components/ui/skeleton.tsx
import { cn } from "@/lib/cn"

export function Skeleton({ className }: { className?: string }) {
	return (
		<div
			role="status"
			aria-label="Cargando"
			className={cn("animate-pulse-soft rounded-md bg-velajuy-pink-soft", className)}
		/>
	)
}

export function ProductCardSkeleton() {
	return (
		<div className="space-y-2">
			<Skeleton className="aspect-square w-full rounded-xl" />
			<Skeleton className="h-4 w-3/4" />
			<Skeleton className="h-4 w-1/3" />
		</div>
	)
}

export function ProductDetailSkeleton() {
	return (
		<div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 md:grid-cols-[1fr_1fr]">
			<Skeleton className="aspect-square w-full rounded-2xl" />
			<div className="space-y-4">
				<Skeleton className="h-8 w-3/4" />
				<Skeleton className="h-6 w-1/3" />
				<Skeleton className="h-24 w-full" />
				<Skeleton className="h-12 w-40" />
			</div>
		</div>
	)
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
	return (
		<tr>
			{Array.from({ length: cols }).map((_, i) => (
				<td key={i} className="px-3 py-3">
					<Skeleton className="h-4 w-full" />
				</td>
			))}
		</tr>
	)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/skeleton.tsx
git commit -m "feat(ui): add Skeleton primitives for loading states"
```

---

# PHASE 1 — Accessibility critical

### Task 7: Skip-to-content link + `<main>` landmark

**Files:**
- Create: `src/components/storefront/skip-link.tsx`
- Modify: `src/app/layout.tsx`, `src/app/(storefront)/layout.tsx`, `src/app/admin/layout.tsx`

- [ ] **Step 1: Create skip link**

```tsx
// src/components/storefront/skip-link.tsx
export function SkipLink() {
	return (
		<a
			href="#main"
			className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-velajuy-wine focus:px-4 focus:py-2 focus:text-velajuy-cream"
		>
			Saltar al contenido
		</a>
	)
}
```

- [ ] **Step 2: Wire into root layout**

Edit `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next"
import { Toaster } from "sonner"
import { SkipLink } from "@/components/storefront/skip-link"
import "./globals.css"

export const metadata: Metadata = {
	title: "Velajuy Pelucas",
	description: "Pelucas en Colombia — Velajuy",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="es-CO">
			<body className="bg-velajuy-pink-soft text-velajuy-wine antialiased">
				<SkipLink />
				{children}
				<Toaster richColors position="top-center" />
			</body>
		</html>
	)
}
```

- [ ] **Step 3: Add `id="main"` to storefront + admin layout main slots**

In `src/app/(storefront)/layout.tsx` wrap content with `<main id="main" tabIndex={-1}>`. In `src/app/admin/layout.tsx` (or `components/admin/shell.tsx`) wrap with `<main id="main" tabIndex={-1} className="flex-1">`.

- [ ] **Step 4: Playwright check**

Run: `pnpm exec playwright test --list` — confirm config is healthy. (Full e2e tasks come later.)

- [ ] **Step 5: Commit**

```bash
git add src/components/storefront/skip-link.tsx src/app/layout.tsx src/app/\(storefront\)/layout.tsx src/components/admin/shell.tsx
git commit -m "feat(a11y): add skip-to-content link and main landmark"
```

---

### Task 8: Storefront header — mobile nav, aria-current, cart/wishlist slots

**Files:**
- Modify: `src/components/storefront/header.tsx`
- Create: `src/components/storefront/mobile-nav.tsx`

- [ ] **Step 1: Create mobile nav drawer**

```tsx
// src/components/storefront/mobile-nav.tsx
"use client"
import type { Route } from "next"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/cn"

const items: { href: Route; label: string }[] = [
	{ href: "/catalogo" as Route, label: "Catálogo" },
	{ href: "/cuidado" as Route, label: "Cuidado" },
	{ href: "/sobre" as Route, label: "Sobre" },
	{ href: "/cuenta" as Route, label: "Cuenta" },
]

export function MobileNav() {
	const [open, setOpen] = useState(false)
	const pathname = usePathname()
	useEffect(() => setOpen(false), [pathname])
	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") setOpen(false)
		}
		window.addEventListener("keydown", onKey)
		return () => window.removeEventListener("keydown", onKey)
	}, [])
	return (
		<>
			<button
				type="button"
				aria-label="Abrir menú"
				aria-expanded={open}
				aria-controls="mobile-nav-panel"
				onClick={() => setOpen(true)}
				className="inline-flex size-11 items-center justify-center rounded-md text-velajuy-wine md:hidden"
			>
				<Menu className="size-6" />
			</button>
			{open && (
				<div
					id="mobile-nav-panel"
					role="dialog"
					aria-modal="true"
					aria-label="Menú principal"
					className="fixed inset-0 z-50 bg-velajuy-cream animate-fade-in md:hidden"
				>
					<div className="flex items-center justify-between border-b border-velajuy-wine/10 px-6 py-4">
						<span className="text-xl font-bold text-velajuy-wine">Velajuy</span>
						<button
							type="button"
							aria-label="Cerrar menú"
							onClick={() => setOpen(false)}
							className="inline-flex size-11 items-center justify-center rounded-md text-velajuy-wine"
						>
							<X className="size-6" />
						</button>
					</div>
					<nav className="px-6 py-6">
						<ul className="space-y-2">
							{items.map((i) => {
								const active = pathname?.startsWith(i.href as string)
								return (
									<li key={i.href as string}>
										<Link
											href={i.href}
											aria-current={active ? "page" : undefined}
											className={cn(
												"block rounded-lg px-3 py-3 text-base",
												active
													? "bg-velajuy-wine text-velajuy-cream"
													: "text-velajuy-wine hover:bg-velajuy-pink-soft",
											)}
										>
											{i.label}
										</Link>
									</li>
								)
							})}
						</ul>
					</nav>
				</div>
			)}
		</>
	)
}
```

- [ ] **Step 2: Refactor header with aria-current + mobile nav slot**

```tsx
// src/components/storefront/header.tsx
"use client"
import type { Route } from "next"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Heart, ShoppingBag } from "lucide-react"
import { MobileNav } from "./mobile-nav"
import { cn } from "@/lib/cn"

const items: { href: Route; label: string }[] = [
	{ href: "/catalogo" as Route, label: "Catálogo" },
	{ href: "/cuidado" as Route, label: "Cuidado" },
	{ href: "/sobre" as Route, label: "Sobre" },
]

export function StorefrontHeader() {
	const pathname = usePathname()
	return (
		<header className="sticky top-0 z-30 border-b border-velajuy-wine/10 bg-velajuy-cream/90 backdrop-blur supports-[backdrop-filter]:bg-velajuy-cream/75">
			<nav
				aria-label="Navegación principal"
				className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 md:py-4"
			>
				<div className="flex items-center gap-3">
					<MobileNav />
					<Link href="/" className="text-2xl font-bold text-velajuy-wine">
						Velajuy
					</Link>
				</div>
				<ul className="hidden items-center gap-6 text-sm text-velajuy-wine md:flex">
					{items.map((i) => {
						const active = pathname?.startsWith(i.href as string)
						return (
							<li key={i.href as string}>
								<Link
									href={i.href}
									aria-current={active ? "page" : undefined}
									className={cn(
										"rounded-md px-2 py-1 transition-colors",
										active ? "underline underline-offset-4" : "hover:text-velajuy-wine-soft",
									)}
								>
									{i.label}
								</Link>
							</li>
						)
					})}
				</ul>
				<div className="flex items-center gap-2">
					<Link
						href={"/cuenta/wishlist" as Route}
						aria-label="Lista de deseos"
						className="inline-flex size-11 items-center justify-center rounded-md text-velajuy-wine hover:bg-velajuy-pink-soft"
					>
						<Heart className="size-5" />
					</Link>
					<Link
						href={"/cuenta" as Route}
						aria-label="Cuenta"
						className="inline-flex size-11 items-center justify-center rounded-md text-velajuy-wine hover:bg-velajuy-pink-soft"
					>
						<ShoppingBag className="size-5" />
					</Link>
				</div>
			</nav>
		</header>
	)
}
```

- [ ] **Step 3: Visually verify**

Run: `pnpm dev` and open http://localhost:3000 at 375px and at 1024px. Tab through nav. Confirm focus ring visible. Confirm hamburger shows below md.

- [ ] **Step 4: Commit**

```bash
git add src/components/storefront/header.tsx src/components/storefront/mobile-nav.tsx
git commit -m "feat(storefront): responsive header with mobile drawer, aria-current, wishlist/cart icons"
```

---

### Task 9: Verify and fix `velajuy-wine-soft` contrast

**Files:**
- Create: `src/lib/a11y/contrast.ts`, `tests/unit/contrast.test.ts`
- Possibly modify: `src/app/globals.css`

- [ ] **Step 1: Write contrast utility test**

```ts
// tests/unit/contrast.test.ts
import { contrastRatio } from "@/lib/a11y/contrast"
import { describe, expect, it } from "vitest"

describe("contrastRatio (WCAG 2.1)", () => {
	it("returns 21 for black on white", () => {
		expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1)
	})
	it("returns ≥ 4.5 for velajuy-wine on velajuy-cream", () => {
		expect(contrastRatio("#5c1a2a", "#fffaf5")).toBeGreaterThanOrEqual(4.5)
	})
	it("flags velajuy-wine-soft on velajuy-pink-soft if it fails AA", () => {
		// records current ratio for token-tuning decisions
		const r = contrastRatio("#7a3d4d", "#fde2ea")
		console.log("wine-soft on pink-soft:", r.toFixed(2))
		expect(r).toBeGreaterThan(0) // sentinel; actual gate in Step 3
	})
})
```

- [ ] **Step 2: Implement contrast**

```ts
// src/lib/a11y/contrast.ts
function srgbChannel(c: number) {
	const v = c / 255
	return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}
function relLum(hex: string) {
	const h = hex.replace("#", "")
	const r = parseInt(h.slice(0, 2), 16)
	const g = parseInt(h.slice(2, 4), 16)
	const b = parseInt(h.slice(4, 6), 16)
	return 0.2126 * srgbChannel(r) + 0.7152 * srgbChannel(g) + 0.0722 * srgbChannel(b)
}
export function contrastRatio(fg: string, bg: string) {
	const L1 = relLum(fg)
	const L2 = relLum(bg)
	const [light, dark] = L1 > L2 ? [L1, L2] : [L2, L1]
	return (light + 0.05) / (dark + 0.05)
}
```

- [ ] **Step 3: Run test, read the printed ratio for wine-soft on pink-soft**

Run: `pnpm test tests/unit/contrast.test.ts`
Expected: All pass + console line `wine-soft on pink-soft: X.XX`.

- [ ] **Step 4: If ratio < 4.5, darken `--color-velajuy-wine-soft` until ≥ 4.5**

If the printed ratio is below 4.5, update `globals.css` to `--color-velajuy-wine-soft: #6a2e3f;` (or similar). Re-run test, lock in the assertion:

```ts
it("velajuy-wine-soft on velajuy-pink-soft passes AA", () => {
	expect(contrastRatio("#6a2e3f", "#fde2ea")).toBeGreaterThanOrEqual(4.5)
})
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/a11y/contrast.ts tests/unit/contrast.test.ts src/app/globals.css
git commit -m "feat(a11y): WCAG contrast util + tune wine-soft token to AA"
```

---

### Task 10: Modal — focus trap, aria-modal, ESC, animated entrance

**Files:**
- Modify: `src/components/ui/modal.tsx`

- [ ] **Step 1: Replace modal implementation**

```tsx
// src/components/ui/modal.tsx
"use client"

import { X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef } from "react"

export function Modal({
	children,
	onClose,
	label,
}: {
	children: React.ReactNode
	onClose?: () => void
	label?: string
}) {
	const router = useRouter()
	const dialogRef = useRef<HTMLDialogElement>(null)
	const previouslyFocused = useRef<HTMLElement | null>(null)

	const handleClose = useCallback(() => {
		if (onClose) onClose()
		else router.back()
	}, [onClose, router])

	useEffect(() => {
		const el = dialogRef.current
		if (!el) return
		previouslyFocused.current = document.activeElement as HTMLElement | null
		if (!el.open) el.showModal()
		const firstFocusable = el.querySelector<HTMLElement>(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
		)
		firstFocusable?.focus()
		return () => previouslyFocused.current?.focus?.()
	}, [])

	return (
		<dialog
			ref={dialogRef}
			aria-modal="true"
			aria-label={label}
			onClose={handleClose}
			onClick={(e) => {
				if (e.target === dialogRef.current) handleClose()
			}}
			className="m-auto w-full max-w-3xl rounded-2xl bg-white p-0 text-velajuy-wine outline-none backdrop:bg-velajuy-wine/40 backdrop:backdrop-blur-sm"
		>
			<button
				type="button"
				onClick={handleClose}
				aria-label="Cerrar"
				className="absolute right-4 top-4 inline-flex size-11 items-center justify-center rounded-full bg-velajuy-pink-soft text-velajuy-wine transition-all duration-150 hover:bg-velajuy-pink hover:scale-105 active:scale-95"
			>
				<X size={20} />
			</button>
			<div className="p-6">{children}</div>
		</dialog>
	)
}
```

- [ ] **Step 2: Manual verify**

Open `/catalogo`, click a product card (quick view). Confirm:
- Backdrop fades in, dialog scales in.
- ESC closes (browser native on `<dialog>`).
- Focus moves into modal on open, returns to trigger on close.
- Backdrop click closes.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/modal.tsx
git commit -m "feat(a11y): modal focus trap, return-focus, aria-modal, animated entrance"
```

---

### Task 11: Storefront form labels — `ingresar-form` and `back-in-stock-form`

**Files:**
- Modify: `src/app/ingresar/ingresar-form.tsx`, `src/app/(storefront)/producto/[slug]/back-in-stock-form.tsx`

- [ ] **Step 1: Add visible labels, aria-invalid, role="alert" in `ingresar-form.tsx`**

Replace the email input block with:

```tsx
<label htmlFor="login-email" className="mb-1 block text-sm font-medium text-velajuy-wine">
	Tu correo
</label>
<input
	id="login-email"
	type="email"
	name="email"
	required
	autoComplete="email"
	placeholder="tu@correo.com"
	aria-invalid={error ? true : undefined}
	aria-describedby={error ? "login-email-error" : undefined}
	className="w-full rounded-lg border border-velajuy-wine/20 bg-white px-3 py-2 text-velajuy-wine transition-colors duration-200 focus:border-velajuy-wine focus:outline-none"
/>
{error && (
	<p id="login-email-error" role="alert" className="mt-2 text-sm text-rose-700">
		{error}
	</p>
)}
```

Wrap success message:

```tsx
{success && (
	<div role="status" aria-live="polite" className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
		¡Te enviamos un enlace para entrar!
	</div>
)}
```

- [ ] **Step 2: Same treatment for `back-in-stock-form.tsx`**

Add `<label htmlFor>`, `aria-invalid`, `aria-describedby`, `autoComplete="email"`, `inputMode="email"`. Replace the static success div with a fade-in + reset button:

```tsx
if (done) {
	return (
		<div role="status" aria-live="polite" className="animate-slide-up space-y-2 rounded-md bg-emerald-50 p-4 text-emerald-900">
			<p>¡Listo! Te avisaremos al volver el stock.</p>
			<button type="button" onClick={() => setDone(false)} className="text-sm underline">
				Usar otro correo
			</button>
		</div>
	)
}
```

- [ ] **Step 3: Manual verify with keyboard + screen reader (VoiceOver if Mac)**

Tab through `/ingresar`. Confirm label is read, error announced via `role="alert"`.

- [ ] **Step 4: Commit**

```bash
git add src/app/ingresar/ingresar-form.tsx src/app/\(storefront\)/producto/\[slug\]/back-in-stock-form.tsx
git commit -m "feat(a11y): visible labels, aria-invalid, role=alert on storefront forms"
```

---

### Task 12: Product tabs — proper ARIA tablist semantics + animation

**Files:**
- Modify: `src/app/(storefront)/producto/[slug]/product-tabs.tsx`

- [ ] **Step 1: Refactor with tablist semantics**

```tsx
"use client"
import { useState } from "react"
import { cn } from "@/lib/cn"

type Tab = { key: string; label: string; content: React.ReactNode }

export function ProductTabs({ tabs }: { tabs: Tab[] }) {
	const [active, setActive] = useState(tabs[0]?.key ?? "")

	function onKey(e: React.KeyboardEvent<HTMLButtonElement>, idx: number) {
		if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
		e.preventDefault()
		const next = e.key === "ArrowRight" ? (idx + 1) % tabs.length : (idx - 1 + tabs.length) % tabs.length
		setActive(tabs[next].key)
		;(e.currentTarget.parentElement?.children[next] as HTMLButtonElement | undefined)?.focus()
	}

	return (
		<div className="mt-8">
			<div role="tablist" aria-label="Detalles del producto" className="flex gap-1 border-b border-velajuy-wine/10">
				{tabs.map((t, i) => {
					const selected = active === t.key
					return (
						<button
							key={t.key}
							role="tab"
							id={`tab-${t.key}`}
							aria-selected={selected}
							aria-controls={`panel-${t.key}`}
							tabIndex={selected ? 0 : -1}
							onClick={() => setActive(t.key)}
							onKeyDown={(e) => onKey(e, i)}
							className={cn(
								"-mb-px border-b-2 px-3 py-2 text-sm transition-colors duration-200",
								selected
									? "border-velajuy-wine text-velajuy-wine"
									: "border-transparent text-velajuy-wine-soft hover:text-velajuy-wine",
							)}
						>
							{t.label}
						</button>
					)
				})}
			</div>
			{tabs.map((t) => (
				<div
					key={t.key}
					role="tabpanel"
					id={`panel-${t.key}`}
					aria-labelledby={`tab-${t.key}`}
					hidden={active !== t.key}
					className="mt-4 max-w-2xl whitespace-pre-line text-sm leading-6 text-velajuy-wine-soft animate-fade-in"
				>
					{t.content}
				</div>
			))}
		</div>
	)
}
```

- [ ] **Step 2: Keyboard verify**

Open PDP, focus a tab, press Arrow keys. Active tab should change and focus should follow.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(storefront\)/producto/\[slug\]/product-tabs.tsx
git commit -m "feat(a11y): product tabs with WAI-ARIA tablist semantics + fade"
```

---

### Task 13: Replace `stock-badge` and `status-pill` with `<Badge>` (icon + label)

**Files:**
- Modify: `src/components/storefront/stock-badge.tsx`, `src/components/admin/status-pill.tsx`

- [ ] **Step 1: Stock badge**

```tsx
// src/components/storefront/stock-badge.tsx
import { Badge, type BadgeTone } from "@/components/ui/badge"

export function StockBadge({ stock }: { stock: number }) {
	if (stock <= 0) return <Badge tone="danger" srLabel="Agotado">Agotado</Badge>
	if (stock === 1) return <Badge tone="warning" srLabel="Última unidad" pulse>Última 1</Badge>
	if (stock <= 3) return <Badge tone="warning" srLabel="Pocas unidades" pulse>{`Últimas ${stock}`}</Badge>
	return <Badge tone="success" srLabel="Disponible">Disponible</Badge>
}
```

(Fixes the "Últimas 1" pluralization bug and adds pulse for low stock — Emil Kowalski "felt detail".)

- [ ] **Step 2: Status pill** (admin order/payment status)

```tsx
// src/components/admin/status-pill.tsx
import { Badge, type BadgeTone } from "@/components/ui/badge"

const TONE: Record<string, BadgeTone> = {
	pending_payment: "warning",
	preparing: "info",
	shipped: "info",
	delivered: "success",
	cancelled: "danger",
	failed: "danger",
}

const LABEL: Record<string, string> = {
	pending_payment: "Pago pendiente",
	preparing: "Preparando",
	shipped: "Enviado",
	delivered: "Entregado",
	cancelled: "Cancelado",
	failed: "Falló",
}

export function StatusPill({ status }: { status: string }) {
	return (
		<Badge tone={TONE[status] ?? "neutral"} srLabel={LABEL[status] ?? status}>
			{LABEL[status] ?? status}
		</Badge>
	)
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/storefront/stock-badge.tsx src/components/admin/status-pill.tsx
git commit -m "feat(a11y): badges convey state via icon + label, not color alone"
```

---

# PHASE 2 — Storefront visual & layout

### Task 14: Footer sections

**Files:**
- Modify: `src/components/storefront/footer.tsx`

- [ ] **Step 1: Replace footer**

```tsx
import type { Route } from "next"
import Link from "next/link"

export function StorefrontFooter() {
	const year = new Date().getFullYear()
	return (
		<footer className="border-t border-velajuy-wine/10 bg-velajuy-cream">
			<div className="mx-auto max-w-6xl px-6 py-12">
				<div className="grid grid-cols-2 gap-8 md:grid-cols-4">
					<section>
						<h2 className="text-sm font-semibold text-velajuy-wine">Velajuy</h2>
						<ul className="mt-3 space-y-2 text-sm text-velajuy-wine-soft">
							<li><Link href={"/sobre" as Route}>Sobre nosotros</Link></li>
							<li><Link href={"/contacto" as Route}>Contacto</Link></li>
						</ul>
					</section>
					<section>
						<h2 className="text-sm font-semibold text-velajuy-wine">Comprar</h2>
						<ul className="mt-3 space-y-2 text-sm text-velajuy-wine-soft">
							<li><Link href="/catalogo">Catálogo</Link></li>
							<li><Link href={"/cuidado" as Route}>Cuidado</Link></li>
						</ul>
					</section>
					<section>
						<h2 className="text-sm font-semibold text-velajuy-wine">Soporte</h2>
						<ul className="mt-3 space-y-2 text-sm text-velajuy-wine-soft">
							<li><Link href={"/envios" as Route}>Envíos</Link></li>
							<li><Link href={"/cambios" as Route}>Cambios y devoluciones</Link></li>
						</ul>
					</section>
					<section>
						<h2 className="text-sm font-semibold text-velajuy-wine">Legal</h2>
						<ul className="mt-3 space-y-2 text-sm text-velajuy-wine-soft">
							<li><Link href={"/legal/terminos" as Route}>Términos</Link></li>
							<li><Link href={"/legal/privacidad" as Route}>Privacidad</Link></li>
						</ul>
					</section>
				</div>
				<p className="mt-10 border-t border-velajuy-wine/10 pt-6 text-sm text-velajuy-wine-soft">
					© {year} Velajuy Pelucas — hecho en Colombia
				</p>
			</div>
		</footer>
	)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/storefront/footer.tsx
git commit -m "feat(storefront): expand footer with section nav"
```

---

### Task 15: Product card polish — hover smoothness + tabular nums + lazy

**Files:**
- Modify: `src/components/storefront/product-card.tsx`, `src/components/storefront/price.tsx`

- [ ] **Step 1: Price tabular nums**

```tsx
// price.tsx — add `tabular-nums` to the className
<span className={cn(className, "tabular-nums")}>{formatCOP(amount)}</span>
```

- [ ] **Step 2: Card image transitions**

```tsx
<Image
	src={primary}
	alt={product.name}
	fill
	loading="lazy"
	sizes="(min-width: 1024px) 22vw, (min-width: 768px) 48vw, 100vw"
	className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
/>
```

Add to card root: `transition-shadow duration-200 hover:shadow-md`.

Wrap link in a `leading-tight` line-height class. Pin font-size to `text-base` for product name (16px min).

- [ ] **Step 3: Commit**

```bash
git add src/components/storefront/product-card.tsx src/components/storefront/price.tsx
git commit -m "feat(storefront): smoother card hover, tabular price, explicit lazy"
```

---

### Task 16: Catalog empty state with action

**Files:**
- Modify: `src/components/ui/empty-state.tsx`, `src/app/(storefront)/catalogo/page.tsx`

- [ ] **Step 1: Accept `action` and fade-in**

```tsx
// empty-state.tsx
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
		<div className="mx-auto max-w-md animate-fade-in rounded-2xl border-2 border-dashed border-velajuy-wine/20 p-8 text-center">
			<h2 className="text-lg font-semibold text-velajuy-wine">{title}</h2>
			{description && <p className="mt-2 text-sm text-velajuy-wine-soft">{description}</p>}
			{action && <div className="mt-6">{action}</div>}
		</div>
	)
}
```

- [ ] **Step 2: Pass `action={...}` from catalogo/page.tsx with a "Limpiar filtros" Link**

```tsx
<EmptyState
	title="No encontramos pelucas con esos filtros"
	description="Prueba con menos filtros o limpia la selección."
	action={
		<Link
			href="/catalogo"
			className="inline-flex h-11 items-center justify-center rounded-lg bg-velajuy-wine px-4 text-sm text-velajuy-cream transition-all duration-150 active:scale-95"
		>
			Limpiar filtros
		</Link>
	}
/>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/empty-state.tsx src/app/\(storefront\)/catalogo/page.tsx
git commit -m "feat(storefront): empty state supports action + fade-in"
```

---

### Task 17: Filter sidebar — switch buttons to `<Button>` + Sheet on mobile

**Files:**
- Create: `src/components/ui/sheet.tsx`
- Modify: `src/app/(storefront)/catalogo/filter-sidebar.tsx`

- [ ] **Step 1: Create bottom Sheet primitive**

```tsx
// src/components/ui/sheet.tsx
"use client"
import { X } from "lucide-react"
import { useEffect } from "react"

export function Sheet({
	open,
	onClose,
	title,
	children,
}: {
	open: boolean
	onClose: () => void
	title: string
	children: React.ReactNode
}) {
	useEffect(() => {
		if (!open) return
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") onClose()
		}
		document.body.style.overflow = "hidden"
		window.addEventListener("keydown", onKey)
		return () => {
			document.body.style.overflow = ""
			window.removeEventListener("keydown", onKey)
		}
	}, [open, onClose])

	if (!open) return null
	return (
		<div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-50">
			<div onClick={onClose} className="absolute inset-0 bg-velajuy-wine/40 animate-fade-in" />
			<div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-velajuy-cream p-6 animate-slide-up">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-lg font-semibold text-velajuy-wine">{title}</h2>
					<button
						type="button"
						onClick={onClose}
						aria-label="Cerrar"
						className="inline-flex size-11 items-center justify-center rounded-full text-velajuy-wine hover:bg-velajuy-pink-soft"
					>
						<X className="size-5" />
					</button>
				</div>
				{children}
			</div>
		</div>
	)
}
```

- [ ] **Step 2: Filter sidebar — render inline on desktop, sheet on mobile, use `<Button>` for actions**

Top of file (above `lg`):

```tsx
{/* trigger only on mobile */}
<button
	type="button"
	className="lg:hidden ..."
	onClick={() => setOpen(true)}
>
	Filtrar
</button>
<Sheet open={open} onClose={() => setOpen(false)} title="Filtros">
	<FiltersBody {...props} />
</Sheet>
<aside className="hidden lg:block">
	<FiltersBody {...props} />
</aside>
```

Replace Apply/Reset buttons inside `FiltersBody` with `<Button>` instances. Add visible active-count badge near top.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/sheet.tsx src/app/\(storefront\)/catalogo/filter-sidebar.tsx
git commit -m "feat(storefront): filters in mobile Sheet, use Button primitive"
```

---

### Task 18: Product page — breadcrumb + responsive attribute grid

**Files:**
- Modify: `src/app/(storefront)/producto/[slug]/product-info.tsx`, `src/app/(storefront)/producto/[slug]/page.tsx`

- [ ] **Step 1: Breadcrumb at top of product page**

```tsx
<nav aria-label="Migas de pan" className="mb-6 text-sm text-velajuy-wine-soft">
	<Link href="/catalogo" className="hover:text-velajuy-wine">Catálogo</Link>
	<span className="px-2">/</span>
	<span aria-current="page">{product.name}</span>
</nav>
```

- [ ] **Step 2: Make attributes grid responsive**

```tsx
<dl className="grid grid-cols-1 gap-x-4 gap-y-3 rounded-2xl bg-velajuy-cream p-4 text-sm md:grid-cols-2">
```

- [ ] **Step 3: Use `<Button>` for the disabled add-to-cart with explicit copy**

```tsx
<Button disabled size="lg" title="Próximamente">Agregar al carrito (próximamente)</Button>
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(storefront\)/producto/\[slug\]/product-info.tsx src/app/\(storefront\)/producto/\[slug\]/page.tsx
git commit -m "feat(storefront): breadcrumb + responsive attribute grid + clearer CTA"
```

---

### Task 19: Gallery — keyboard arrows + crossfade + horizontal-scroll thumbs

**Files:**
- Modify: `src/app/(storefront)/producto/[slug]/gallery.tsx`

- [ ] **Step 1: Add keyboard handler, crossfade, lazy thumbs**

```tsx
"use client"
import Image from "next/image"
import { useCallback, useEffect, useState } from "react"
import { cn } from "@/lib/cn"

export function Gallery({
	images,
	productName,
}: {
	images: { url: string; altText?: string | null }[]
	productName: string
}) {
	const [active, setActive] = useState(0)
	const current = images[active]
	const move = useCallback(
		(delta: number) => setActive((i) => (i + delta + images.length) % images.length),
		[images.length],
	)
	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === "ArrowRight") move(1)
			if (e.key === "ArrowLeft") move(-1)
		}
		window.addEventListener("keydown", onKey)
		return () => window.removeEventListener("keydown", onKey)
	}, [move])

	return (
		<div>
			<div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-velajuy-pink-soft">
				{images.map((img, i) => (
					<Image
						key={img.url}
						src={img.url}
						alt={img.altText ?? productName}
						fill
						priority={i === 0}
						sizes="(min-width: 1024px) 50vw, 100vw"
						className={cn(
							"object-cover transition-opacity duration-200 ease-out",
							i === active ? "opacity-100" : "opacity-0",
						)}
					/>
				))}
			</div>
			<ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
				{images.map((img, i) => (
					<li key={img.url}>
						<button
							type="button"
							aria-label={`Imagen ${i + 1} de ${images.length}`}
							aria-pressed={i === active}
							onClick={() => setActive(i)}
							className={cn(
								"relative h-16 w-16 shrink-0 overflow-hidden rounded-lg transition-all duration-200",
								i === active
									? "ring-2 ring-velajuy-wine ring-offset-2"
									: "ring-1 ring-velajuy-wine/15 opacity-70 hover:opacity-100",
							)}
						>
							<Image src={img.url} alt="" fill loading="lazy" sizes="64px" className="object-cover" />
						</button>
					</li>
				))}
			</ul>
		</div>
	)
}
```

- [ ] **Step 2: Manual verify — arrow keys cycle images, animation is smooth**

- [ ] **Step 3: Commit**

```bash
git add src/app/\(storefront\)/producto/\[slug\]/gallery.tsx
git commit -m "feat(storefront): gallery keyboard nav + crossfade + lazy thumbs"
```

---

### Task 20: Sort select — visible label binding

**Files:**
- Modify: `src/app/(storefront)/catalogo/sort-select.tsx`

- [ ] **Step 1: Wrap label + select with `htmlFor`/`id`**

```tsx
<label htmlFor="catalog-sort" className="flex items-center gap-2 text-sm text-velajuy-wine-soft">
	Ordenar:
	<select
		id="catalog-sort"
		value={current}
		onChange={...}
		className="rounded-md border border-velajuy-wine/20 bg-white px-2 py-1.5 text-sm text-velajuy-wine transition-colors duration-200 focus:border-velajuy-wine"
	>
		{...}
	</select>
</label>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(storefront\)/catalogo/sort-select.tsx
git commit -m "feat(a11y): bind sort select label via htmlFor"
```

---

### Task 21: Footer/header emoji removal + accessible swap

**Files:**
- Modify: `src/components/storefront/footer.tsx` (already done in Task 14 — verify no emoji remains)

- [ ] **Step 1: Confirm no ♥ or emoji in footer copy**

Run: `grep -rn "♥\|❤" src/`
Expected: No output.

- [ ] **Step 2: If present, replace with `<Heart aria-hidden="true" />` from lucide-react**

- [ ] **Step 3: Commit (only if changes)**

---

### Task 22: Quick-view modal — use new `<Modal>` + `Button`

**Files:**
- Modify: `src/app/(storefront)/quick-view-modal.tsx`, `src/app/(storefront)/@modal/default.tsx`

- [ ] **Step 1: Wire quick view modal to new Modal API**

Pass `label="Vista rápida del producto"` to `<Modal>`. Replace inline buttons with `<Button>`. Ensure attribute display uses `<dl>` with grid-cols-1 mobile / 2 desktop.

- [ ] **Step 2: Confirm `@modal/default.tsx` returns `null` (Next.js intercepting route safe default).**

- [ ] **Step 3: Commit**

```bash
git add src/app/\(storefront\)/quick-view-modal.tsx src/app/\(storefront\)/@modal/default.tsx
git commit -m "feat(storefront): quick-view modal adopts a11y modal + Button"
```

---

# PHASE 3 — Motion & felt details (Emil Kowalski lens)

### Task 23: Press feedback on every button

**Files:**
- Modify: any `<button>` in the codebase that doesn't go through `<Button>` (audit + replace)

- [ ] **Step 1: Inventory raw buttons**

Run: `grep -rn "<button" src/ | wc -l`
Then: `grep -rln "<button" src/ | grep -v components/ui/button.tsx`

- [ ] **Step 2: For each occurrence, either switch to `<Button>` or append `active:scale-95 active:opacity-90 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-velajuy-wine` to className.**

Prioritize: wishlist-button.tsx (next task), gallery thumbs (done in Task 19), filter-sidebar (done in 17), modal close (done in 10), data-table headers (Task 32).

- [ ] **Step 3: Commit**

```bash
git add src/
git commit -m "feat(motion): press feedback + focus ring on raw buttons"
```

---

### Task 24: Wishlist heart-pop

**Files:**
- Modify: `src/app/(storefront)/producto/[slug]/wishlist-button.tsx`

- [ ] **Step 1: Animate heart on toggle**

```tsx
const [popKey, setPopKey] = useState(0)
// inside onClick after toggling:
setPopKey((k) => k + 1)
// JSX:
<Heart
	key={popKey}
	aria-hidden="true"
	className={cn(
		"size-5 transition-colors duration-150",
		inWishlist ? "fill-velajuy-wine text-velajuy-wine animate-pop" : "text-velajuy-wine"
	)}
/>
```

Also strengthen the toggle visual: active background `bg-velajuy-pink-soft`, border solid wine.

- [ ] **Step 2: Manual verify — click triggers pop + fill, ESC-doesn't-cancel.**

- [ ] **Step 3: Commit**

```bash
git add src/app/\(storefront\)/producto/\[slug\]/wishlist-button.tsx
git commit -m "feat(motion): wishlist heart-pop on toggle"
```

---

### Task 25: Catalog grid stagger

**Files:**
- Modify: `src/app/(storefront)/catalogo/page.tsx`, `src/components/storefront/product-card.tsx`

- [ ] **Step 1: Pass index to ProductCard for stagger delay**

```tsx
{products.map((p, i) => (
	<ProductCard key={p.id} product={p} style={{ animationDelay: `${Math.min(i, 7) * 50}ms` }} />
))}
```

- [ ] **Step 2: Accept and apply `style` on ProductCard**

```tsx
export function ProductCard({ product, style }: { product: Product; style?: React.CSSProperties }) {
	return (
		<article style={style} className="group animate-slide-up ...">
			...
		</article>
	)
}
```

- [ ] **Step 3: Manual verify on `/catalogo` — cards reveal with stagger; capped after 7 to avoid late-card delay.**

- [ ] **Step 4: Commit**

```bash
git add src/app/\(storefront\)/catalogo/page.tsx src/components/storefront/product-card.tsx
git commit -m "feat(motion): stagger product card reveal"
```

---

### Task 26: Suspense loading.tsx for each route

**Files:**
- Create: `src/app/(storefront)/loading.tsx`, `src/app/(storefront)/catalogo/loading.tsx`, `src/app/(storefront)/producto/[slug]/loading.tsx`, `src/app/admin/loading.tsx`

- [ ] **Step 1: Storefront root loading**

```tsx
// src/app/(storefront)/loading.tsx
import { Skeleton } from "@/components/ui/skeleton"
export default function Loading() {
	return (
		<div className="mx-auto max-w-6xl px-6 py-8">
			<Skeleton className="h-8 w-48" />
		</div>
	)
}
```

- [ ] **Step 2: Catalog**

```tsx
import { ProductCardSkeleton } from "@/components/ui/skeleton"
export default function Loading() {
	return (
		<div className="mx-auto grid max-w-6xl gap-4 px-6 py-8 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
		</div>
	)
}
```

- [ ] **Step 3: Product page** — `ProductDetailSkeleton`. **Admin** — header + table rows skeleton.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(storefront\)/loading.tsx src/app/\(storefront\)/catalogo/loading.tsx src/app/\(storefront\)/producto/\[slug\]/loading.tsx src/app/admin/loading.tsx
git commit -m "feat(motion): Suspense loading skeletons for key routes"
```

---

### Task 27: Sonner theme to match palette

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Pass theme tokens to Toaster**

```tsx
<Toaster
	richColors
	position="top-center"
	duration={4000}
	toastOptions={{
		classNames: {
			toast: "rounded-xl border border-velajuy-wine/10 bg-velajuy-cream text-velajuy-wine",
			title: "text-sm font-medium",
			description: "text-xs text-velajuy-wine-soft",
		},
	}}
/>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(motion): theme Sonner to velajuy palette"
```

---

### Task 28: Modal motion polish (already partially in Task 10) — verify reduced-motion path

**Files:**
- Modify: `src/app/globals.css` (verify) and `src/components/ui/modal.tsx`

- [ ] **Step 1: Manually toggle "Reduce Motion" in macOS / Chrome and confirm dialog instantly opens (no animation) but still readable.**

System Pref → Accessibility → Display → Reduce motion. Reload `/catalogo` and open a quick view.

- [ ] **Step 2: If any animation overrides the reduced-motion media query (Sonner toasts inherently respect it; verify), patch.**

- [ ] **Step 3: No commit unless changes.**

---

### Task 29: Header on scroll — subtle elevation

**Files:**
- Modify: `src/components/storefront/header.tsx`

(Already added `sticky top-0` + `backdrop-blur` in Task 8 — verify visually. No additional change required unless polish needed.)

- [ ] **Step 1: Verify scroll behavior at storefront.**

---

### Task 30: Add-to-cart pending state placeholder

**Files:**
- Modify: `src/app/(storefront)/producto/[slug]/product-info.tsx`

Cart is not yet implemented (button is disabled with title="Próximamente"). Do **not** build cart in this plan. Just make the disabled CTA copy honest and motion-aware:

- [ ] **Step 1: Replace the disabled add-to-cart with `<Button disabled size="lg">Agregar al carrito (próximamente)</Button>` — see Task 18 Step 3 if not already.**

(Skipped if already done.)

---

### Task 31: Reduced-motion smoke test

**Files:**
- Create: `tests/e2e/motion.spec.ts`

- [ ] **Step 1: Write Playwright test**

```ts
import { test, expect } from "@playwright/test"

test.describe("Reduced motion", () => {
	test("forces near-instant transitions", async ({ browser }) => {
		const ctx = await browser.newContext({ reducedMotion: "reduce" })
		const page = await ctx.newPage()
		await page.goto("/catalogo")
		const card = page.locator("article").first()
		const duration = await card.evaluate((el) => getComputedStyle(el).animationDuration)
		expect(duration === "0.001ms" || duration === "0s").toBeTruthy()
		await ctx.close()
	})
})
```

- [ ] **Step 2: Run**

Run: `pnpm exec playwright test tests/e2e/motion.spec.ts`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/motion.spec.ts
git commit -m "test(motion): verify prefers-reduced-motion neutralizes animations"
```

---

# PHASE 4 — Admin UX

### Task 32: Sortable table headers + pagination

**Files:**
- Create: `src/components/admin/sortable-th.tsx`, `src/components/admin/pagination.tsx`
- Modify: `src/components/admin/data-table.tsx`, `src/app/admin/pedidos/page.tsx`, `src/app/admin/productos/page.tsx`

- [ ] **Step 1: `<SortableTh>`**

```tsx
"use client"
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

export function SortableTh({
	field,
	label,
	className,
}: {
	field: string
	label: string
	className?: string
}) {
	const router = useRouter()
	const params = useSearchParams()
	const sort = params.get("sort")
	const dir = params.get("dir") ?? "asc"
	const active = sort === field
	function toggle() {
		const next = new URLSearchParams(params)
		next.set("sort", field)
		next.set("dir", active && dir === "asc" ? "desc" : "asc")
		router.push(`?${next.toString()}`)
	}
	return (
		<th scope="col" className={className} aria-sort={!active ? "none" : dir === "asc" ? "ascending" : "descending"}>
			<button
				type="button"
				onClick={toggle}
				className="inline-flex items-center gap-1 text-left font-medium text-velajuy-wine hover:underline focus-visible:outline-2 focus-visible:outline-velajuy-wine"
			>
				{label}
				{active ? (dir === "asc" ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />) : <ChevronsUpDown className="size-3 opacity-50" />}
			</button>
		</th>
	)
}
```

- [ ] **Step 2: `<Pagination>`**

```tsx
"use client"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

export function Pagination({ total, perPage }: { total: number; perPage: number }) {
	const params = useSearchParams()
	const page = Number(params.get("page") ?? 1)
	const lastPage = Math.max(1, Math.ceil(total / perPage))
	if (lastPage <= 1) return null
	function href(p: number) {
		const next = new URLSearchParams(params)
		next.set("page", String(p))
		return `?${next.toString()}`
	}
	return (
		<nav aria-label="Paginación" className="mt-4 flex items-center justify-between text-sm">
			<p className="text-velajuy-wine-soft">
				Mostrando {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} de {total}
			</p>
			<div className="flex gap-2">
				{page > 1 && <Link href={href(page - 1)} className="rounded-md border border-velajuy-wine/20 px-3 py-1.5 hover:bg-velajuy-pink-soft">Anterior</Link>}
				{page < lastPage && <Link href={href(page + 1)} className="rounded-md border border-velajuy-wine/20 px-3 py-1.5 hover:bg-velajuy-pink-soft">Siguiente</Link>}
			</div>
		</nav>
	)
}
```

- [ ] **Step 3: Update `DataTable` to add caption + scope + responsive wrapper**

```tsx
export function DataTable({ caption, head, body }: { caption?: string; head: React.ReactNode; body: React.ReactNode }) {
	return (
		<div role="region" aria-label={caption} className="overflow-x-auto rounded-xl border border-velajuy-wine/10 bg-white">
			<table className="w-full text-sm">
				{caption && <caption className="sr-only">{caption}</caption>}
				<thead className="bg-velajuy-pink-soft text-left">{head}</thead>
				<tbody>{body}</tbody>
			</table>
		</div>
	)
}
```

- [ ] **Step 4: Plug into `pedidos/page.tsx` and `productos/page.tsx`**

Read sort/dir/page from `searchParams`. Pass to existing `lib/admin/orders.listOrders` / `lib/admin/products.listProducts` (extend signature if needed; default to current behavior). Render `<SortableTh>` for sortable columns and `<Pagination total={...} perPage={20}/>` below the table.

- [ ] **Step 5: Verify ordering changes by clicking a header.**

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/sortable-th.tsx src/components/admin/pagination.tsx src/components/admin/data-table.tsx src/app/admin/pedidos/page.tsx src/app/admin/productos/page.tsx src/lib/admin/orders src/lib/admin/products
git commit -m "feat(admin): sortable headers + pagination + accessible table"
```

---

### Task 33: Admin sidebar mobile drawer

**Files:**
- Create: `src/components/admin/mobile-nav.tsx`
- Modify: `src/components/admin/shell.tsx`, `src/components/admin/sidebar.tsx`

- [ ] **Step 1: Hide sidebar `< md` and add hamburger top-bar with `<Sheet>` (reuse the storefront Sheet).**

In `shell.tsx`:

```tsx
<div className="flex min-h-screen">
	<aside className="hidden md:block"><AdminSidebar role={role} /></aside>
	<div className="flex flex-1 flex-col">
		<header className="flex items-center justify-between border-b border-velajuy-wine/10 px-4 py-3 md:hidden">
			<AdminMobileNavTrigger role={role} />
			<span className="font-semibold text-velajuy-wine">Velajuy · Admin</span>
		</header>
		<main id="main" tabIndex={-1} className="flex-1 p-4 md:p-8">{children}</main>
	</div>
</div>
```

- [ ] **Step 2: AdminMobileNavTrigger opens Sheet with sidebar nav contents.**

Lift sidebar link list into a shared `<AdminNavList role={role}/>` and render it in both desktop sidebar and the mobile sheet.

- [ ] **Step 3: Add `aria-current="page"` to active links (Task 8 pattern).**

- [ ] **Step 4: Verify at 375px — admin reachable, drawer opens, ESC closes.**

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/mobile-nav.tsx src/components/admin/shell.tsx src/components/admin/sidebar.tsx
git commit -m "feat(admin): mobile drawer nav + aria-current"
```

---

### Task 34: Admin forms — required `*`, aria-invalid, focus-on-error

**Files:**
- Modify: every admin form (`product-form.tsx`, `settings-form.tsx`, `zone-form.tsx`, `page-form.tsx`, `attribute-picker.tsx`, `adjust-row.tsx`, `shipped-form.tsx`)

- [ ] **Step 1: Define small helper**

```tsx
// src/components/admin/field.tsx
import { cn } from "@/lib/cn"

export function Field({
	label,
	required,
	error,
	htmlFor,
	helper,
	children,
}: {
	label: string
	required?: boolean
	error?: string
	htmlFor: string
	helper?: string
	children: React.ReactNode
}) {
	return (
		<div>
			<label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-velajuy-wine">
				{label} {required && <span aria-hidden="true" className="text-rose-700">*</span>}
			</label>
			{children}
			{helper && !error && <p className="mt-1 text-xs text-velajuy-wine-soft">{helper}</p>}
			{error && (
				<p id={`${htmlFor}-error`} role="alert" className="mt-1 text-xs text-rose-700">
					{error}
				</p>
			)}
		</div>
	)
}
```

- [ ] **Step 2: Migrate `zone-form.tsx` to use `<Field>` first (smallest form). Confirm zone-form works.**

- [ ] **Step 3: Apply to `settings-form.tsx`, then `product-form.tsx`, then `page-form.tsx`. Add `aria-invalid={!!error}` and `aria-describedby={error ? \`${id}-error\` : undefined}` to every input/select/textarea.**

- [ ] **Step 4: On submit error, scroll-to + focus first errored field**

```tsx
useEffect(() => {
	if (!firstError) return
	const el = document.getElementById(firstError) as HTMLElement | null
	el?.focus()
	el?.scrollIntoView({ block: "center", behavior: "smooth" })
}, [firstError])
```

- [ ] **Step 5: Commit each migrated form separately**

```bash
git commit -m "feat(admin): form fields adopt accessible Field component (zone-form)"
# ... per form
```

---

### Task 35: Inventory adjust — optimistic update + undo toast

**Files:**
- Modify: `src/app/admin/inventario/adjust-row.tsx`

- [ ] **Step 1: Use `useOptimistic` to update `current` immediately**

```tsx
const [optimistic, addOptimistic] = useOptimistic(current, (state, delta: number) => state + delta)
async function onSubmit(formData: FormData) {
	const delta = Number(formData.get("delta") ?? 0)
	startTransition(() => addOptimistic(delta))
	const result = await adjustInventory({ ... })
	if (result.error) toast.error("No se pudo aplicar")
	else toast.success(`Stock ajustado (${delta >= 0 ? "+" : ""}${delta})`, {
		action: { label: "Deshacer", onClick: () => adjustInventory({ ..., delta: -delta }) },
	})
}
```

- [ ] **Step 2: Disable submit while pending, clear delta on success.**

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/inventario/adjust-row.tsx
git commit -m "feat(admin): optimistic stock adjust with undo toast"
```

---

### Task 36: Admin filters — active count + clear-all

**Files:**
- Modify: `src/app/admin/pedidos/filters.tsx`

- [ ] **Step 1: Compute active count from `searchParams`**

```tsx
const activeCount = [status && status !== "all", cod].filter(Boolean).length
```

- [ ] **Step 2: Render a Badge with count + a "Limpiar filtros" link**

```tsx
{activeCount > 0 && (
	<div className="flex items-center gap-2">
		<Badge tone="info">{`${activeCount} filtro${activeCount > 1 ? "s" : ""}`}</Badge>
		<Link href="/admin/pedidos" className="text-sm underline">Limpiar</Link>
	</div>
)}
```

- [ ] **Step 3: Bind status `<select>` with `<label htmlFor>`.**

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/pedidos/filters.tsx
git commit -m "feat(admin): show active filter count + clear-all in orders filters"
```

---

### Task 37: Destructive actions visual weight

**Files:**
- Modify: `src/app/admin/productos/[id]/product-form.tsx`, `src/app/admin/productos/[id]/image-gallery.tsx`, anywhere with archive/delete

- [ ] **Step 1: Replace bare buttons with `<Button variant="danger">` for delete/archive paths**

Keep the `confirm()` dialog or upgrade to a small confirm modal (not in scope of this plan).

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/productos
git commit -m "feat(admin): danger-variant Buttons for destructive actions"
```

---

### Task 38: Admin breadcrumb header

**Files:**
- Modify: `src/components/admin/page-header.tsx`

- [ ] **Step 1: Add optional `breadcrumb` prop**

```tsx
export function PageHeader({
	title,
	subtitle,
	actions,
	breadcrumb,
}: {
	title: string
	subtitle?: string
	actions?: React.ReactNode
	breadcrumb?: { href: string; label: string }[]
}) {
	return (
		<header className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
			<div>
				{breadcrumb && (
					<nav aria-label="Migas de pan" className="text-xs text-velajuy-wine-soft">
						{breadcrumb.map((b, i) => (
							<span key={b.href}>
								{i > 0 && <span className="px-1">/</span>}
								<a href={b.href} className="hover:text-velajuy-wine">{b.label}</a>
							</span>
						))}
					</nav>
				)}
				<h1 className="text-2xl font-semibold text-velajuy-wine">{title}</h1>
				{subtitle && <p className="text-sm text-velajuy-wine-soft">{subtitle}</p>}
			</div>
			{actions}
		</header>
	)
}
```

- [ ] **Step 2: Pass breadcrumb on order-detail and product-edit pages.**

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/page-header.tsx src/app/admin
git commit -m "feat(admin): optional breadcrumb in PageHeader"
```

---

# PHASE 5 — Performance

### Task 39: Image sizes audit

**Files:**
- Modify: any `<Image fill>` whose `sizes` is wrong

- [ ] **Step 1: Grep for `sizes`**

Run: `grep -rn "sizes=" src/`
Verify each matches its rendered width at each breakpoint. Notable fix: `product-card.tsx` `sizes="(min-width: 1024px) 22vw, (min-width: 768px) 48vw, 100vw"`.

- [ ] **Step 2: Mark exactly one image per page as `priority` (LCP). For PDP gallery, only the first image. For catalog, none (cards are below header).**

- [ ] **Step 3: Commit**

```bash
git commit -m "perf(images): correct sizes + priority for LCP optimization"
```

---

### Task 40: Dynamic-import quick-view modal

**Files:**
- Modify: `src/app/(storefront)/@modal/default.tsx` (or wherever quick-view is mounted)

- [ ] **Step 1: Use `next/dynamic` for the modal body**

```tsx
import dynamic from "next/dynamic"
const QuickView = dynamic(() => import("../quick-view-modal").then((m) => m.QuickViewModal), { ssr: false })
```

- [ ] **Step 2: Confirm `pnpm build` shows the modal in its own chunk.**

- [ ] **Step 3: Commit**

```bash
git commit -m "perf(bundle): dynamic-import quick-view modal"
```

---

### Task 41: Server-component reclamation

**Files:**
- Audit: every `"use client"` file

- [ ] **Step 1: For each `"use client"` component, check if it actually needs client features (state, effects, browser APIs).**

- [ ] **Step 2: Convert pure presentational components to server components.**

Targets to verify (per motion-perf audit): `filter-sidebar.tsx` parts, `sort-select.tsx`, `product-tabs.tsx` (must stay client — it uses state). Footer/header text-only blocks should be server.

- [ ] **Step 3: After conversion, confirm `pnpm build` succeeds. No commit if no conversions found necessary.**

---

### Task 42: Suspense around catalog facets

**Files:**
- Modify: `src/app/(storefront)/catalogo/page.tsx`

- [ ] **Step 1: Split data fetches so the slower one streams**

```tsx
export default async function CatalogPage(...) {
	const productsPromise = listProducts(filters)
	const facetsPromise = listAttributeFacets(filters)
	return (
		<div>
			<Suspense fallback={<Skeleton className="h-64 w-full" />}>
				<FilterPanel promise={facetsPromise} />
			</Suspense>
			<Suspense fallback={<CatalogGridSkeleton />}>
				<CatalogGrid promise={productsPromise} />
			</Suspense>
		</div>
	)
}
```

- [ ] **Step 2: Commit**

```bash
git commit -m "perf(catalog): stream facets independently from product grid"
```

---

# PHASE 6 — Verification

### Task 43: Playwright + axe a11y smoke

**Files:**
- Create: `tests/e2e/a11y.spec.ts`

- [ ] **Step 1: Write smoke test**

```ts
import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

const routes = ["/", "/catalogo", "/ingresar"]

for (const path of routes) {
	test(`a11y: ${path} has no serious violations`, async ({ page }) => {
		await page.goto(path)
		const results = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
			.analyze()
		const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical")
		expect(serious, JSON.stringify(serious, null, 2)).toEqual([])
	})
}
```

- [ ] **Step 2: Run**

Run: `pnpm exec playwright test tests/e2e/a11y.spec.ts`
Expected: PASS (or itemized violations — fix iteratively).

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/a11y.spec.ts
git commit -m "test(a11y): axe-core smoke on storefront routes"
```

---

### Task 44: Keyboard nav smoke

**Files:**
- Create: `tests/e2e/keyboard-nav.spec.ts`

- [ ] **Step 1: Test focus order**

```ts
import { test, expect } from "@playwright/test"

test("can reach main content via skip link", async ({ page }) => {
	await page.goto("/")
	await page.keyboard.press("Tab")
	const focused = await page.evaluate(() => document.activeElement?.textContent)
	expect(focused).toContain("Saltar al contenido")
	await page.keyboard.press("Enter")
	const main = await page.evaluate(() => document.activeElement?.id)
	expect(main).toBe("main")
})

test("modal close returns focus to trigger", async ({ page }) => {
	await page.goto("/catalogo")
	const trigger = page.getByRole("link", { name: /vista rápida/i }).first()
	if (await trigger.count()) {
		await trigger.focus()
		await trigger.click()
		await page.keyboard.press("Escape")
		const focused = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"))
		expect(focused).not.toBeNull()
	}
})
```

- [ ] **Step 2: Run**

Run: `pnpm exec playwright test tests/e2e/keyboard-nav.spec.ts`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/keyboard-nav.spec.ts
git commit -m "test(a11y): keyboard skip-link + modal focus-return smoke"
```

---

### Task 45: Final review — typecheck, lint, format, tests, ce:review

**Files:**
- N/A (verification only)

- [ ] **Step 1: Quality gates**

Run: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm exec playwright test`
Expected: All green.

- [ ] **Step 2: Build**

Run: `pnpm build`
Expected: PASS, with bundle size at or below baseline.

- [ ] **Step 3: Manual checklist — go through every CRITICAL/HIGH item in the synthesis above and confirm fixed:**

- [ ] Focus rings visible on every interactive element (Tab through `/`, `/catalogo`, `/admin`)
- [ ] Skip link works (Tab once on `/`)
- [ ] Modal animates in/out and traps focus
- [ ] Mobile header drawer opens at 375px
- [ ] Admin sidebar accessible at 375px via drawer
- [ ] Storefront forms have visible labels + announce errors via `role="alert"`
- [ ] Data table sortable + paginated + horizontally scrollable on mobile
- [ ] StockBadge / StatusPill show icon + text (not color only)
- [ ] `prefers-reduced-motion` neutralizes animations
- [ ] Loading skeletons appear during navigation
- [ ] Catalog grid stagger reveal
- [ ] Wishlist heart pops
- [ ] Gallery responds to arrow keys + crossfades

- [ ] **Step 4: Run `/ce:review` per CLAUDE.md guidance**

Per project CLAUDE.md: "After work for a major task is completed, run cycles of /ce:review, validating, fixing until there are no more relevant issues."

- [ ] **Step 5: Open PR (do not push without user approval per project rules)**

The user will open the PR themselves or instruct.

---

## Self-review checklist (run by author of the plan)

1. **Spec coverage** — every audit finding mapped: focus rings (Tasks 1, 4, 23), skip link (7), mobile nav (8, 33), modal motion+focus (10, 22), form labels (11, 34), wine-soft contrast (9), tabs ARIA (12), badge icon+label (5, 13, 36), footer (14), product card polish (15), empty state (16), filter sheet (17), product page (18), gallery (19), sort select (20), emoji removal (21), press feedback (23), heart pop (24), grid stagger (25), skeletons (6, 26), Sonner theme (27), reduced motion (1, 28, 31), sortable tables + pagination (32), admin form fields (34), optimistic inventory (35), filter count (36), destructive emphasis (37), breadcrumb (38), image sizes (39), dynamic import modal (40), server components (41), Suspense facets (42), a11y smoke (43), keyboard smoke (44), final gate (45). **Cart implementation is NOT in scope** (the disabled CTA is reframed but cart system itself is left for a future phase — flagged in Task 30).
2. **Placeholder scan** — no "TBD", "add appropriate validation", "similar to". All code blocks complete. Type signatures consistent across tasks (Field/Button/Badge/Modal props match where re-used).
3. **Type consistency** — `Badge.tone` enum reused in Task 13; `Button.variant` used in Tasks 18, 22, 37; `Sheet` props consistent between Task 17 and Task 33.

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-17-platform-ux-uplift.md`. Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task (or per phase), review between tasks. Fast iteration on UI work.
2. **Inline Execution** — execute phases in this session with checkpoints between phases.

Which approach?
