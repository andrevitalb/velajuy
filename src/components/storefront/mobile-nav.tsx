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
