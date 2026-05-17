"use client"
import type { Route } from "next"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/cn"

const items: { href: Route; label: string }[] = [
	{ href: "/catalogo" as Route, label: "Catálogo" },
	{ href: "/cuidado" as Route, label: "Cuidado" },
	{ href: "/sobre" as Route, label: "Sobre" },
	{ href: "/cuenta" as Route, label: "Cuenta" },
]

export function MobileNav() {
	const pathname = usePathname()
	const [open, setOpen] = useState(false)
	const [lastPath, setLastPath] = useState(pathname)
	const panelRef = useRef<HTMLDivElement>(null)
	const closeButtonRef = useRef<HTMLButtonElement>(null)
	const previouslyFocused = useRef<HTMLElement | null>(null)
	if (pathname !== lastPath) {
		setLastPath(pathname)
		if (open) setOpen(false)
	}
	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") setOpen(false)
		}
		window.addEventListener("keydown", onKey)
		return () => window.removeEventListener("keydown", onKey)
	}, [])
	// Drawer lifecycle: when `open` flips true we (1) lock body scroll so iOS
	// Safari doesn't scroll-through the background, (2) remember the trigger
	// that opened the drawer, (3) move focus into the panel after paint, and
	// (4) install a focus trap on Tab/Shift+Tab. The cleanup runs on close
	// (button, ESC, route change, or unmount) and restores body scroll and
	// focus. Do not split these concerns — they share a single lifecycle.
	useEffect(() => {
		if (!open) return
		previouslyFocused.current = document.activeElement as HTMLElement | null
		const prevOverflow = document.body.style.overflow
		document.body.style.overflow = "hidden"
		queueMicrotask(() => {
			closeButtonRef.current?.focus()
		})
		function onKey(e: KeyboardEvent) {
			if (e.key !== "Tab") return
			const panel = panelRef.current
			if (!panel) return
			const focusables = panel.querySelectorAll<HTMLElement>(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
			)
			if (focusables.length === 0) return
			const first = focusables[0]
			const last = focusables[focusables.length - 1]
			const active = document.activeElement as HTMLElement | null
			if (e.shiftKey) {
				if (active === first || !panel.contains(active)) {
					e.preventDefault()
					last.focus()
				}
			} else {
				if (active === last) {
					e.preventDefault()
					first.focus()
				}
			}
		}
		document.addEventListener("keydown", onKey)
		return () => {
			document.removeEventListener("keydown", onKey)
			document.body.style.overflow = prevOverflow
			previouslyFocused.current?.focus?.()
		}
	}, [open])
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
					ref={panelRef}
					id="mobile-nav-panel"
					role="dialog"
					aria-modal="true"
					aria-label="Menú principal"
					className="fixed inset-0 z-50 bg-velajuy-cream animate-fade-in md:hidden"
				>
					<div className="flex items-center justify-between border-b border-velajuy-wine/10 px-6 py-4">
						<span className="text-xl font-bold text-velajuy-wine">Velajuy</span>
						<button
							ref={closeButtonRef}
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
