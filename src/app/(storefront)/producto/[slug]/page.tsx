import { notFound } from "next/navigation"
import { getProductBySlug, listRelated } from "@/lib/catalog/queries"
import { ProductGallery } from "./gallery"
import { ProductInfo } from "./product-info"

export default async function ProductoPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params
	const product = await getProductBySlug(slug)
	if (!product) notFound()

	const related = await listRelated(product.id, 4)

	return (
		<main className="mx-auto max-w-6xl px-6 py-12">
			<div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
				<ProductGallery
					images={product.images.map((i) => ({ id: i.id, url: i.url, altText: i.altText }))}
					productName={product.name}
				/>
				<ProductInfo
					name={product.name}
					priceAmount={product.priceAmount}
					priceCurrency={product.priceCurrency}
					stockQuantity={product.stockQuantity}
					shortDescription={product.shortDescription}
					attributes={product.attributes.map((a) => ({
						attrName: a.attrName,
						valueName: a.valueName,
					}))}
					wishlistSlot={null}
					backInStockSlot={null}
				/>
			</div>

			{related.length > 0 ? (
				<section className="mt-16">
					<h2 className="mb-4 text-xl font-semibold text-velajuy-wine">También te puede gustar</h2>
					<ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
						{related.map((p) => (
							<li key={p.id}>
								<a
									href={`/producto/${p.slug}`}
									className="block rounded-2xl bg-white p-3 shadow-sm hover:shadow-md"
								>
									<div className="relative aspect-square overflow-hidden rounded-xl bg-velajuy-pink-soft">
										{p.primaryImageUrl ? (
											// eslint-disable-next-line @next/next/no-img-element
											<img
												src={p.primaryImageUrl}
												alt={p.name}
												className="absolute inset-0 h-full w-full object-cover"
											/>
										) : null}
									</div>
									<div className="mt-2 text-sm font-medium text-velajuy-wine">{p.name}</div>
								</a>
							</li>
						))}
					</ul>
				</section>
			) : null}
		</main>
	)
}
