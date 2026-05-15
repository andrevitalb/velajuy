import type { Route } from "next"
import Link from "next/link"

export function StorefrontHeader() {
	return (
		<header className="border-b border-velajuy-wine/10 bg-velajuy-cream">
			<nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
				<Link href="/" className="text-2xl font-bold text-velajuy-wine">
					Velajuy
				</Link>
				<ul className="flex items-center gap-6 text-sm text-velajuy-wine">
					<li>
						<Link href="/catalogo">Catálogo</Link>
					</li>
					<li>
						<Link href={"/cuidado" as Route}>Cuidado</Link>
					</li>
					<li>
						<Link href={"/sobre" as Route}>Sobre</Link>
					</li>
					<li>
						<Link href={"/cuenta" as Route}>Cuenta</Link>
					</li>
				</ul>
			</nav>
		</header>
	)
}
