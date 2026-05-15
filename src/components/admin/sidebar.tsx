import Link from "next/link"
import type { Route } from "next"

const links: { href: Route; label: string }[] = [
	{ href: "/admin" as Route, label: "Dashboard" },
	{ href: "/admin/pedidos" as Route, label: "Pedidos" },
	{ href: "/admin/productos" as Route, label: "Productos" },
	{ href: "/admin/inventario" as Route, label: "Inventario" },
	{ href: "/admin/zonas" as Route, label: "Zonas de envío" },
	{ href: "/admin/paginas" as Route, label: "Páginas" },
	{ href: "/admin/configuracion" as Route, label: "Configuración" },
]

export function AdminSidebar() {
	return (
		<aside className="w-60 shrink-0 border-r border-velajuy-wine/10 bg-velajuy-cream p-4">
			<Link href={"/admin" as Route} className="block text-xl font-bold text-velajuy-wine">
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
