"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import type { Route } from "next"
import { useEffect, useState } from "react"
import {
	Bell,
	Boxes,
	FileText,
	LayoutDashboard,
	LogOut,
	MoreHorizontal,
	Package,
	Settings,
	ShoppingBag,
	Truck,
} from "lucide-react"
import { signOut } from "@/lib/auth-client"
import { Sheet } from "@/components/ui/sheet"
import { cn } from "@/lib/cn"
import type { AdminRole } from "./sidebar"

type Item = {
	href: Route
	label: string
	icon: React.ElementType
	ownerOnly?: boolean
	matchesPath: (pathname: string | null) => boolean
}

const PRIMARY: Item[] = [
	{
		href: "/admin" as Route,
		label: "Inicio",
		icon: LayoutDashboard,
		matchesPath: (p) => p === "/admin",
	},
	{
		href: "/admin/pedidos" as Route,
		label: "Pedidos",
		icon: ShoppingBag,
		matchesPath: (p) => p?.startsWith("/admin/pedidos") ?? false,
	},
	{
		href: "/admin/productos" as Route,
		label: "Productos",
		icon: Package,
		matchesPath: (p) => p?.startsWith("/admin/productos") ?? false,
	},
	{
		href: "/admin/inventario" as Route,
		label: "Inventario",
		icon: Boxes,
		matchesPath: (p) => p?.startsWith("/admin/inventario") ?? false,
	},
]

const OVERFLOW: Item[] = [
	{
		href: "/admin/back-in-stock" as Route,
		label: "Back-in-stock",
		icon: Bell,
		matchesPath: (p) => p?.startsWith("/admin/back-in-stock") ?? false,
	},
	{
		href: "/admin/zonas" as Route,
		label: "Zonas de envío",
		icon: Truck,
		ownerOnly: true,
		matchesPath: (p) => p?.startsWith("/admin/zonas") ?? false,
	},
	{
		href: "/admin/paginas" as Route,
		label: "Páginas",
		icon: FileText,
		ownerOnly: true,
		matchesPath: (p) => p?.startsWith("/admin/paginas") ?? false,
	},
	{
		href: "/admin/configuracion" as Route,
		label: "Configuración",
		icon: Settings,
		ownerOnly: true,
		matchesPath: (p) => p?.startsWith("/admin/configuracion") ?? false,
	},
]

export function AdminBottomNav({ role }: { role: AdminRole }) {
	const pathname = usePathname()
	const router = useRouter()
	const [moreOpen, setMoreOpen] = useState(false)
	const overflowItems = OVERFLOW.filter((i) => (i.ownerOnly ? role === "owner" : true))

	// Close the More sheet whenever the route changes (e.g. user tapped a link).
	useEffect(() => {
		setMoreOpen(false)
	}, [pathname])

	const onOverflowPage = overflowItems.some((i) => i.matchesPath(pathname))

	async function handleSignOut() {
		setMoreOpen(false)
		await signOut()
		router.push("/admin/ingresar")
	}

	return (
		<>
			<nav
				aria-label="Navegación principal"
				className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-velajuy-wine/10 bg-velajuy-cream pb-[env(safe-area-inset-bottom)] md:hidden print:hidden"
			>
				{PRIMARY.map((item) => {
					const Icon = item.icon
					const active = item.matchesPath(pathname)
					return (
						<Link
							key={item.href}
							href={item.href}
							aria-current={active ? "page" : undefined}
							className={cn(
								"flex flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors duration-150",
								active ? "text-velajuy-wine" : "text-velajuy-wine-soft hover:text-velajuy-wine",
							)}
						>
							<span
								className={cn(
									"flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-150",
									active && "bg-velajuy-pink-soft",
								)}
							>
								<Icon className="size-5" aria-hidden="true" />
							</span>
							{item.label}
						</Link>
					)
				})}
				<button
					type="button"
					onClick={() => setMoreOpen(true)}
					aria-haspopup="dialog"
					aria-expanded={moreOpen}
					aria-current={onOverflowPage ? "page" : undefined}
					className={cn(
						"flex flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors duration-150 active:scale-95",
						onOverflowPage ? "text-velajuy-wine" : "text-velajuy-wine-soft hover:text-velajuy-wine",
					)}
				>
					<span
						className={cn(
							"flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-150",
							onOverflowPage && "bg-velajuy-pink-soft",
						)}
					>
						<MoreHorizontal className="size-5" aria-hidden="true" />
					</span>
					Más
				</button>
			</nav>
			<Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="Más">
				<ul className="space-y-1">
					{overflowItems.map((item) => {
						const Icon = item.icon
						const active = item.matchesPath(pathname)
						return (
							<li key={item.href}>
								<Link
									href={item.href}
									aria-current={active ? "page" : undefined}
									className={cn(
										"flex h-12 items-center gap-3 rounded-lg px-3 text-sm transition-colors duration-150",
										active
											? "bg-velajuy-wine text-white"
											: "text-velajuy-wine hover:bg-velajuy-pink-soft",
									)}
								>
									<Icon className="size-5 shrink-0" aria-hidden="true" />
									{item.label}
								</Link>
							</li>
						)
					})}
					<li className="pt-2">
						<button
							type="button"
							onClick={handleSignOut}
							className="flex h-12 w-full items-center gap-3 rounded-lg border border-velajuy-wine/15 px-3 text-sm text-velajuy-wine transition-all duration-150 hover:bg-velajuy-pink-soft active:scale-[0.98]"
						>
							<LogOut className="size-5 shrink-0" aria-hidden="true" />
							Cerrar sesión
						</button>
					</li>
				</ul>
			</Sheet>
		</>
	)
}
