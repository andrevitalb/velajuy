import { notFound } from "next/navigation"
import { eq } from "drizzle-orm"
import { PageHeader } from "@/components/admin/page-header"
import { db } from "@/lib/db"
import { attributes, attributeValues, productAttributeValues } from "@/lib/db/schema"
import { getProductForEdit } from "@/lib/admin/products/queries"
import { requireAdmin } from "@/lib/auth-guards"
import { ProductForm } from "./product-form"
import { ImageGallery } from "./image-gallery"

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
	await requireAdmin()
	const { id } = await params
	const product = await getProductForEdit(id)
	if (!product) notFound()

	const attrRows = await db.select().from(attributes).orderBy(attributes.sortOrder)
	const valueRows = await db.select().from(attributeValues).orderBy(attributeValues.sortOrder)
	const selected = await db
		.select({ id: productAttributeValues.attributeValueId })
		.from(productAttributeValues)
		.where(eq(productAttributeValues.productId, id))
	const grouped = attrRows.map((a) => ({
		id: a.id,
		name: a.name,
		values: valueRows.filter((v) => v.attributeId === a.id),
	}))

	return (
		<>
			<PageHeader title={product.name} subtitle={`SKU ${product.skuCode ?? "—"}`} />
			<ImageGallery
				productId={product.id}
				images={product.images.map((img) => ({
					id: img.id,
					url: img.url,
					altText: img.altText ?? "",
				}))}
			/>
			<div className="mt-8">
				<ProductForm
					mode="edit"
					productId={product.id}
					attributes={grouped}
					defaultValues={{
						slug: product.slug,
						name: product.name,
						shortDescription: product.shortDescription ?? "",
						description: product.description ?? "",
						status: product.status,
						pricePesos: Math.round(Number(product.priceAmount) / 100),
						weightGrams: product.weightGrams,
						skuCode: product.skuCode ?? "",
						lowStockThreshold: product.lowStockThreshold,
						dianTaxRate: product.dianTaxRate,
						attributeValueIds: selected.map((s) => s.id),
					}}
				/>
			</div>
		</>
	)
}
