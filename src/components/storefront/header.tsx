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
