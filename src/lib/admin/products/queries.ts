import { and, asc, count, desc, eq, inArray, lte, type SQL } from "drizzle-orm"
import { db } from "@/lib/db"
import { productImages, products, type Product } from "@/lib/db/schema"

export type ProductFilters = { status?: Product["status"]; lowStockOnly?: boolean }

function buildProductsWhere(filters: ProductFilters): SQL | undefined {
	const where: SQL[] = []
	if (filters.status) where.push(eq(products.status, filters.status))
	if (filters.lowStockOnly) where.push(lte(products.stockQuantity, products.lowStockThreshold))
	return where.length ? and(...where) : undefined
}

const PRODUCT_COLUMNS = {
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
} as const

async function attachImages<T extends { primaryImageId: string | null }>(rows: T[]) {
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

export type ProductsSortField = "name" | "status" | "priceAmount" | "stockQuantity" | "updatedAt"

const PRODUCTS_SORT_MAP = {
	name: products.name,
	status: products.status,
	priceAmount: products.priceAmount,
	stockQuantity: products.stockQuantity,
	updatedAt: products.updatedAt,
} as const

export async function listAdminProductsPaginated(
	filters: ProductFilters = {},
	options: {
		sort?: ProductsSortField
		dir?: "asc" | "desc"
		page?: number
		perPage?: number
	} = {},
) {
	const sortField = options.sort && PRODUCTS_SORT_MAP[options.sort] ? options.sort : "updatedAt"
	const dir = options.dir === "asc" ? "asc" : "desc"
	const perPage = Math.max(1, options.perPage ?? 20)
	const page = Math.max(1, options.page ?? 1)
	const where = buildProductsWhere(filters)
	const col = PRODUCTS_SORT_MAP[sortField]
	const orderExpr = dir === "asc" ? asc(col) : desc(col)
	const [rows, totalRows] = await Promise.all([
		db
			.select(PRODUCT_COLUMNS)
			.from(products)
			.where(where)
			.orderBy(orderExpr)
			.limit(perPage)
			.offset((page - 1) * perPage),
		db.select({ value: count() }).from(products).where(where),
	])
	const withImages = await attachImages(rows)
	return { rows: withImages, total: Number(totalRows[0]?.value ?? 0) }
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
