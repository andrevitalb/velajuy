import { ProductCard } from "@/components/storefront/product-card"
import type { ProductCard as ProductCardData } from "@/lib/catalog/queries"

export function RelatedProducts({ items }: { items: ProductCardData[] }) {
	if (items.length === 0) return null
	return (
		<section className="mt-16">
			<h2 className="mb-4 text-xl font-semibold text-velajuy-wine">También te puede gustar</h2>
			<ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				{items.map((p) => (
					<li key={p.id}>
						<ProductCard product={p} />
					</li>
				))}
			</ul>
		</section>
	)
}
