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

export type AdminRole = "owner" | "staff"

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
	{
		href: "/admin/configuracion" as Route,
		label: "Configuración",
		icon: Settings,
		ownerOnly: true,
	},
]

export function AdminNavList({
	role,
	onNavigate,
}: {
	role: AdminRole
	onNavigate?: () => void
}) {
	const pathname = usePathname()
	const visible = LINKS.filter((l) => (l.ownerOnly ? role === "owner" : true))

	return (
		<nav className="space-y-1">
			{visible.map((l) => {
				const Icon = l.icon
				const active =
					l.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(l.href as string)
				return (
					<Link
						key={l.href}
						href={l.href}
						aria-current={active ? "page" : undefined}
						onClick={onNavigate}
						className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors duration-150 ${
							active
								? "bg-velajuy-wine text-white"
								: "text-velajuy-wine hover:bg-velajuy-pink-soft"
						}`}
					>
						<Icon className="size-4" aria-hidden="true" /> {l.label}
					</Link>
				)
			})}
		</nav>
	)
}

export function AdminSidebar({ role }: { role: AdminRole }) {
	return (
		<aside className="hidden w-60 shrink-0 border-r border-velajuy-wine/10 bg-velajuy-cream p-4 print:hidden md:block">
			<Link href={"/admin" as Route} className="block text-xl font-bold text-velajuy-wine">
				Velajuy · Admin
			</Link>
			<div className="mt-6">
				<AdminNavList role={role} />
			</div>
		</aside>
	)
}
