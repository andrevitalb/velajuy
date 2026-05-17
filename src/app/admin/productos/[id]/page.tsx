import { notFound } from "next/navigation"
import { eq } from "drizzle-orm"
import { PageHeader } from "@/components/admin/page-header"
import { db } from "@/lib/db"
import { attributes, attributeValues, productAttributeValues } from "@/lib/db/schema"
import { getProductForEdit } from "@/lib/admin/products/queries"
import { requireAdmin } from "@/lib/auth-guards"
import { ProductForm } from "./product-form"

// NOTE: ImageGallery will be created in Task 15. Until then render a stub
// placeholder so this page compiles. The placeholder is a non-interactive
// div listing image URLs.

function ImagesPlaceholder({ images }: { images: { id: string; url: string }[] }) {
	if (images.length === 0) {
		return (
			<p className="text-sm text-velajuy-wine-soft">Sin imágenes (la galería se conecta en T15).</p>
		)
	}
	return (
		<ul className="flex flex-wrap gap-2">
			{images.map((img) => (
				<li key={img.id} className="size-16 overflow-hidden rounded-lg bg-velajuy-pink-soft">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={img.url} alt="" className="size-full object-cover" />
				</li>
			))}
		</ul>
	)
}

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
			<section className="rounded-2xl border border-velajuy-wine/10 bg-white p-5">
				<h2 className="mb-4 text-lg font-bold text-velajuy-wine">Imágenes</h2>
				<ImagesPlaceholder images={product.images.map((i) => ({ id: i.id, url: i.url }))} />
			</section>
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
