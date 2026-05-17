import { PageHeader } from "@/components/admin/page-header"
import { db } from "@/lib/db"
import { attributes, attributeValues } from "@/lib/db/schema"
import { requireOwner } from "@/lib/auth-guards"
import { ProductForm } from "../[id]/product-form"

export default async function NewProductPage() {
	await requireOwner()
	const attrRows = await db.select().from(attributes).orderBy(attributes.sortOrder)
	const valueRows = await db.select().from(attributeValues).orderBy(attributeValues.sortOrder)
	const grouped = attrRows.map((a) => ({
		id: a.id,
		name: a.name,
		values: valueRows.filter((v) => v.attributeId === a.id),
	}))

	return (
		<>
			<PageHeader title="Nuevo producto" />
			<ProductForm
				mode="create"
				attributes={grouped}
				defaultValues={{
					slug: "",
					name: "",
					shortDescription: "",
					description: "",
					status: "draft",
					pricePesos: 0,
					weightGrams: null,
					skuCode: "",
					lowStockThreshold: 2,
					dianTaxRate: 19,
					attributeValueIds: [],
				}}
			/>
		</>
	)
}
