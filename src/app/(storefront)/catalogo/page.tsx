import Link from "next/link"
import { Suspense } from "react"
import { type CatalogFilters, filtersFromSearchParams } from "@/lib/catalog/filters"
import {
	type AttributeFacet,
	type ProductCard as ProductCardData,
	listAttributeFacets,
	listProducts,
} from "@/lib/catalog/queries"
import { ProductCard } from "@/components/storefront/product-card"
import { EmptyState } from "@/components/ui/empty-state"
import { ProductCardSkeleton, Skeleton } from "@/components/ui/skeleton"
import { FilterSidebar } from "./filter-sidebar"
import { SortSelect } from "./sort-select"

function FilterSidebarSkeleton() {
	return (
		<div className="hidden lg:block space-y-4">
			<Skeleton className="h-6 w-24" />
			<Skeleton className="h-4 w-full" />
			<Skeleton className="h-4 w-5/6" />
			<Skeleton className="h-4 w-4/6" />
			<Skeleton className="h-6 w-24 mt-6" />
			<Skeleton className="h-4 w-full" />
			<Skeleton className="h-4 w-5/6" />
		</div>
	)
}

function CatalogGridSkeleton() {
	return (
		<ul className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
			{Array.from({ length: 8 }).map((_, i) => (
				<li key={i}>
					<ProductCardSkeleton />
				</li>
			))}
		</ul>
	)
}

async function FilterPanelAsync({ promise }: { promise: Promise<AttributeFacet[]> }) {
	const facets = await promise
	return <FilterSidebar facets={facets} />
}

async function CatalogGridAsync({ promise }: { promise: Promise<ProductCardData[]> }) {
	const items = await promise
	if (items.length === 0) {
		return (
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
		)
	}
	return (
		<ul className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
			{items.map((p, i) => (
				<li key={p.id}>
					<ProductCard product={p} style={{ animationDelay: `${Math.min(i, 7) * 50}ms` }} />
				</li>
			))}
		</ul>
	)
}

export default async function CatalogoPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
	const params = await searchParams
	const filters: CatalogFilters = filtersFromSearchParams(params)
	const productsPromise = listProducts(filters)
	const facetsPromise = listAttributeFacets()

	return (
		<main className="mx-auto max-w-6xl px-6 py-12">
			<header className="flex items-end justify-between">
				<h1 className="text-3xl font-bold text-velajuy-wine">Catálogo</h1>
				<SortSelect current={filters.sort} />
			</header>

			<div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[16rem_1fr]">
				<Suspense fallback={<FilterSidebarSkeleton />}>
					<FilterPanelAsync promise={facetsPromise} />
				</Suspense>
				<section>
					<Suspense fallback={<CatalogGridSkeleton />}>
						<CatalogGridAsync promise={productsPromise} />
					</Suspense>
				</section>
			</div>
		</main>
	)
}
