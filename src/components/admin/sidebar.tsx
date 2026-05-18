"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { Route } from "next"
import { useEffect, useState } from "react"
import {
	LayoutDashboard,
	ShoppingBag,
	Package,
	Boxes,
	Truck,
	FileText,
	Bell,
	Settings,
	PanelLeftClose,
	PanelLeftOpen,
} from "lucide-react"
import { cn } from "@/lib/cn"

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

const STORAGE_KEY = "velajuy-admin-sidebar-collapsed"

export function AdminNavList({
	role,
	collapsed,
	onNavigate,
}: {
	role: AdminRole
	collapsed?: boolean
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
						title={collapsed ? l.label : undefined}
						aria-label={collapsed ? l.label : undefined}
						className={cn(
							"flex items-center gap-2 rounded-lg text-sm transition-colors duration-150",
							collapsed ? "h-10 w-10 justify-center" : "px-3 py-2",
							active
								? "bg-velajuy-wine text-white"
								: "text-velajuy-wine hover:bg-velajuy-pink-soft",
						)}
					>
						<Icon className="size-4 shrink-0" aria-hidden="true" />
						{!collapsed && <span className="truncate">{l.label}</span>}
					</Link>
				)
			})}
		</nav>
	)
}

export function AdminSidebar({ role }: { role: AdminRole }) {
	const [collapsed, setCollapsed] = useState(false)
	const [hydrated, setHydrated] = useState(false)

	useEffect(() => {
		const stored = window.localStorage.getItem(STORAGE_KEY)
		setCollapsed(stored === "1")
		setHydrated(true)
	}, [])

	function toggle() {
		setCollapsed((prev) => {
			const next = !prev
			try {
				window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0")
			} catch {
				// localStorage unavailable; ignore.
			}
			return next
		})
	}

	return (
		<aside
			className={cn(
				"hidden shrink-0 border-r border-velajuy-wine/10 bg-velajuy-cream p-3 transition-[width] duration-200 ease-out print:hidden md:flex md:flex-col",
				collapsed ? "w-16" : "w-60",
				// Avoid layout flicker before localStorage hydration resolves the
				// stored preference: keep the default ("not collapsed") width until
				// hydration is complete.
				!hydrated && "w-60",
			)}
			aria-label="Navegación del admin"
		>
			<div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}>
				{!collapsed && (
					<Link
						href={"/admin" as Route}
						className="truncate px-1 text-xl font-bold text-velajuy-wine"
					>
						Velajuy · Admin
					</Link>
				)}
				<button
					type="button"
					onClick={toggle}
					title={collapsed ? "Expandir menú" : "Contraer menú"}
					aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
					aria-expanded={!collapsed}
					className="inline-flex size-10 items-center justify-center rounded-lg text-velajuy-wine transition-all duration-150 hover:bg-velajuy-pink-soft active:scale-95"
				>
					{collapsed ? (
						<PanelLeftOpen className="size-5" aria-hidden="true" />
					) : (
						<PanelLeftClose className="size-5" aria-hidden="true" />
					)}
				</button>
			</div>
			<div className="mt-6 flex-1">
				<AdminNavList role={role} collapsed={collapsed} />
			</div>
		</aside>
	)
}
