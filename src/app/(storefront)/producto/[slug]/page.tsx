import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { getPagesBySlugs, getProductBySlug, listRelated } from "@/lib/catalog/queries"
import { isInWishlist } from "@/lib/wishlist/queries"
import { ProductGallery } from "./gallery"
import { ProductInfo } from "./product-info"
import { ProductTabs } from "./product-tabs"
import { RelatedProducts } from "./related-products"
import { WishlistButton } from "./wishlist-button"

const TAB_PAGE_SLUGS = ["pdp-cuidado", "pdp-envio", "pdp-devoluciones"]

const FALLBACK_TABS: Record<string, { label: string; body: string }> = {
	"pdp-cuidado": {
		label: "Cuidado",
		body: "Lava la peluca con shampoo suave en agua fría. Sécala al aire y guárdala sobre un soporte.",
	},
	"pdp-envio": {
		label: "Envío",
		body: "Enviamos a toda Colombia. Envío gratis comprando 3 pelucas o más.",
	},
	"pdp-devoluciones": {
		label: "Devoluciones",
		body: "Por higiene, las pelucas no aceptan devoluciones. Escríbenos antes de comprar si tienes dudas.",
	},
}

export default async function ProductoPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params
	const product = await getProductBySlug(slug)
	if (!product) notFound()

	const session = await auth.api.getSession({ headers: await headers() })
	const userId = session?.user.id ?? null
	const startingInWishlist = userId ? await isInWishlist(userId, product.id) : false

	const [related, pageBodies] = await Promise.all([
		listRelated(product.id, 4),
		getPagesBySlugs(TAB_PAGE_SLUGS),
	])

	const tabs = [
		{
			key: "descripcion",
			label: "Descripción",
			body: product.description ?? product.shortDescription ?? "",
		},
		{
			key: "cuidado",
			label: FALLBACK_TABS["pdp-cuidado"].label,
			body: pageBodies["pdp-cuidado"] ?? FALLBACK_TABS["pdp-cuidado"].body,
		},
		{
			key: "envio",
			label: FALLBACK_TABS["pdp-envio"].label,
			body: pageBodies["pdp-envio"] ?? FALLBACK_TABS["pdp-envio"].body,
		},
		{
			key: "devoluciones",
			label: FALLBACK_TABS["pdp-devoluciones"].label,
			body: pageBodies["pdp-devoluciones"] ?? FALLBACK_TABS["pdp-devoluciones"].body,
		},
	]

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
					wishlistSlot={
						<WishlistButton
							productId={product.id}
							productSlug={product.slug}
							initialInWishlist={startingInWishlist}
							isAuthenticated={!!userId}
						/>
					}
					backInStockSlot={null}
				/>
			</div>

			<ProductTabs tabs={tabs} />

			<RelatedProducts items={related} />
		</main>
	)
}
