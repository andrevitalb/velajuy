import Link from "next/link"
import { filtersFromSearchParams } from "@/lib/catalog/filters"
import { listAttributeFacets, listProducts } from "@/lib/catalog/queries"
import { ProductCard } from "@/components/storefront/product-card"
import { EmptyState } from "@/components/ui/empty-state"
import { FilterSidebar } from "./filter-sidebar"
import { SortSelect } from "./sort-select"

export default async function CatalogoPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
	const params = await searchParams
	const filters = filtersFromSearchParams(params)
	const [items, facets] = await Promise.all([listProducts(filters), listAttributeFacets()])

	return (
		<main className="mx-auto max-w-6xl px-6 py-12">
			<header className="flex items-end justify-between">
				<h1 className="text-3xl font-bold text-velajuy-wine">Catálogo</h1>
				<SortSelect current={filters.sort} />
			</header>

			<div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[16rem_1fr]">
				<FilterSidebar facets={facets} />
				<section>
					{items.length === 0 ? (
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
					) : (
						<ul className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
							{items.map((p, i) => (
								<li key={p.id}>
									<ProductCard
										product={p}
										style={{ animationDelay: `${Math.min(i, 7) * 50}ms` }}
									/>
								</li>
							))}
						</ul>
					)}
				</section>
			</div>
		</main>
	)
}
