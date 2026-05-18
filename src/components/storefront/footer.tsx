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
							<li>
								<Link href={"/sobre" as Route}>Sobre nosotros</Link>
							</li>
							<li>
								<Link href={"/contacto" as Route}>Contacto</Link>
							</li>
						</ul>
					</section>
					<section>
						<h2 className="text-sm font-semibold text-velajuy-wine">Comprar</h2>
						<ul className="mt-3 space-y-2 text-sm text-velajuy-wine-soft">
							<li>
								<Link href="/catalogo">Catálogo</Link>
							</li>
							<li>
								<Link href={"/cuidado" as Route}>Cuidado</Link>
							</li>
						</ul>
					</section>
					<section>
						<h2 className="text-sm font-semibold text-velajuy-wine">Soporte</h2>
						<ul className="mt-3 space-y-2 text-sm text-velajuy-wine-soft">
							<li>
								<Link href={"/envios" as Route}>Envíos</Link>
							</li>
							<li>
								<Link href={"/cambios" as Route}>Cambios y devoluciones</Link>
							</li>
						</ul>
					</section>
					<section>
						<h2 className="text-sm font-semibold text-velajuy-wine">Legal</h2>
						<ul className="mt-3 space-y-2 text-sm text-velajuy-wine-soft">
							<li>
								<Link href={"/legal/terminos" as Route}>Términos</Link>
							</li>
							<li>
								<Link href={"/legal/privacidad" as Route}>Privacidad</Link>
							</li>
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
