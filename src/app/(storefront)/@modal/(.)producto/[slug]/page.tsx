import { notFound } from "next/navigation"
import { getProductBySlug } from "@/lib/catalog/queries"
import { QuickViewModal } from "../../../quick-view-modal"

export default async function QuickViewRoute({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params
	const product = await getProductBySlug(slug)
	if (!product) notFound()
	const primary = product.images[0] ?? null
	return (
		<QuickViewModal
			name={product.name}
			priceAmount={product.priceAmount}
			priceCurrency={product.priceCurrency}
			stockQuantity={product.stockQuantity}
			imageUrl={primary?.url ?? null}
			shortDescription={product.shortDescription}
			attributes={product.attributes.map((a) => ({ attrName: a.attrName, valueName: a.valueName }))}
		/>
	)
}
