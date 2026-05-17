import { and, desc, eq, inArray, lte, type SQL } from "drizzle-orm"
import { db } from "@/lib/db"
import { productImages, products, type Product } from "@/lib/db/schema"

export type ProductFilters = { status?: Product["status"]; lowStockOnly?: boolean }

export async function listAdminProducts(filters: ProductFilters = {}) {
	const where: SQL[] = []
	if (filters.status) where.push(eq(products.status, filters.status))
	if (filters.lowStockOnly) where.push(lte(products.stockQuantity, products.lowStockThreshold))
	const rows = await db
		.select({
			id: products.id,
			slug: products.slug,
			name: products.name,
			status: products.status,
			priceAmount: products.priceAmount,
			stockQuantity: products.stockQuantity,
			lowStockThreshold: products.lowStockThreshold,
			skuCode: products.skuCode,
			primaryImageId: products.primaryImageId,
			updatedAt: products.updatedAt,
		})
		.from(products)
		.where(where.length ? and(...where) : undefined)
		.orderBy(desc(products.updatedAt))
	const imageIds = rows.map((r) => r.primaryImageId).filter((x): x is string => !!x)
	const images = imageIds.length
		? await db.select().from(productImages).where(inArray(productImages.id, imageIds))
		: []
	const imageById = new Map(images.map((img) => [img.id, img]))
	return rows.map((r) => ({
		...r,
		primaryImageUrl: r.primaryImageId ? (imageById.get(r.primaryImageId)?.url ?? null) : null,
	}))
}

export async function getProductForEdit(productId: string) {
	const [row] = await db.select().from(products).where(eq(products.id, productId))
	if (!row) return null
	const images = await db
		.select()
		.from(productImages)
		.where(eq(productImages.productId, productId))
		.orderBy(productImages.sortOrder)
	return { ...row, images }
}
