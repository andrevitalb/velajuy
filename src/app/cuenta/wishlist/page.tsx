import type { Route } from "next"
import Link from "next/link"
import { ProductCard } from "@/components/storefront/product-card"
import { EmptyState } from "@/components/ui/empty-state"
import { requireSession } from "@/lib/auth-guards"
import { listUserWishlist } from "@/lib/wishlist/queries"

export default async function WishlistPage() {
	const session = await requireSession("/cuenta/wishlist")
	const items = await listUserWishlist(session.user.id)

	return (
		<main className="mx-auto max-w-5xl px-6 py-12">
			<h1 className="text-3xl font-bold text-velajuy-wine">Mi lista de deseos</h1>
			{items.length === 0 ? (
				<div className="mt-8">
					<EmptyState
						title="Tu lista está vacía"
						description="Cuando guardes una peluca con el corazón, aparecerá acá."
						action={
							<Link
								href={"/catalogo" as Route}
								className="inline-block rounded-xl bg-velajuy-wine px-5 py-2.5 text-sm font-medium text-white"
							>
								Ir al catálogo
							</Link>
						}
					/>
				</div>
			) : (
				<ul className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
					{items.map((p) => (
						<li key={p.id}>
							<ProductCard
								product={{
									id: p.id,
									slug: p.slug,
									name: p.name,
									shortDescription: p.shortDescription,
									priceAmount: p.priceAmount,
									priceCurrency: p.priceCurrency,
									stockQuantity: p.stockQuantity,
									primaryImageUrl: p.primaryImageUrl,
								}}
							/>
						</li>
					))}
				</ul>
			)}
		</main>
	)
}
