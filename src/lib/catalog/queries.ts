import { and, asc, desc, eq, gt, inArray, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import {
	attributes,
	attributeValues,
	pages,
	productAttributeValues,
	productImages,
	products,
} from "@/lib/db/schema"
import type { CatalogFilters } from "./filters"

export type ProductCard = {
	id: string
	slug: string
	name: string
	shortDescription: string | null
	priceAmount: number
	priceCurrency: string
	stockQuantity: number
	primaryImageUrl: string | null
}

export type AttributeFacet = {
	slug: string
	name: string
	values: Array<{ slug: string; name: string; count: number }>
}

const ATTRIBUTE_SLUGS = ["color", "largo", "estilo"] as const

async function resolveValueIds(
	attrSlug: (typeof ATTRIBUTE_SLUGS)[number],
	valueSlugs: string[],
): Promise<string[]> {
	if (valueSlugs.length === 0) return []
	const rows = await db
		.select({ id: attributeValues.id })
		.from(attributeValues)
		.innerJoin(attributes, eq(attributes.id, attributeValues.attributeId))
		.where(and(eq(attributes.slug, attrSlug), inArray(attributeValues.slug, valueSlugs)))
	return rows.map((r) => r.id)
}

async function productIdsMatchingValues(valueIds: string[]): Promise<string[]> {
	if (valueIds.length === 0) return []
	const rows = await db
		.select({ productId: productAttributeValues.productId })
		.from(productAttributeValues)
		.where(inArray(productAttributeValues.attributeValueId, valueIds))
	return Array.from(new Set(rows.map((r) => r.productId)))
}

export async function listProducts(filters: CatalogFilters): Promise<ProductCard[]> {
	const conditions = [eq(products.status, "active")]

	if (filters.disponible) {
		conditions.push(gt(products.stockQuantity, 0))
	}

	// For each chosen attribute, the product must match at least one of the selected values.
	for (const slug of ATTRIBUTE_SLUGS) {
		const selected = filters[slug]
		if (selected.length === 0) continue
		const valueIds = await resolveValueIds(slug, selected)
		const matching = await productIdsMatchingValues(valueIds)
		if (matching.length === 0) return []
		conditions.push(inArray(products.id, matching))
	}

	const orderBy =
		filters.sort === "precio-asc"
			? asc(products.priceAmount)
			: filters.sort === "precio-desc"
				? desc(products.priceAmount)
				: desc(products.createdAt)

	const rows = await db
		.select({
			id: products.id,
			slug: products.slug,
			name: products.name,
			shortDescription: products.shortDescription,
			priceAmount: products.priceAmount,
			priceCurrency: products.priceCurrency,
			stockQuantity: products.stockQuantity,
			imageUrl: productImages.url,
		})
		.from(products)
		.leftJoin(productImages, eq(productImages.id, products.primaryImageId))
		.where(and(...conditions))
		.orderBy(orderBy)

	return rows.map((r) => ({
		id: r.id,
		slug: r.slug,
		name: r.name,
		shortDescription: r.shortDescription,
		priceAmount: r.priceAmount,
		priceCurrency: r.priceCurrency,
		stockQuantity: r.stockQuantity,
		primaryImageUrl: r.imageUrl,
	}))
}

export async function getPagesBySlugs(slugs: string[]): Promise<Record<string, string>> {
	if (slugs.length === 0) return {}
	const rows = await db.select().from(pages).where(inArray(pages.slug, slugs))
	const out: Record<string, string> = {}
	for (const r of rows) {
		out[r.slug] = typeof r.body === "string" ? r.body : JSON.stringify(r.body ?? "")
	}
	return out
}

export async function listAttributeFacets(): Promise<AttributeFacet[]> {
	const rows = await db
		.select({
			attrSlug: attributes.slug,
			attrName: attributes.name,
			attrSortOrder: attributes.sortOrder,
			valueSlug: attributeValues.slug,
			valueName: attributeValues.name,
			valueSortOrder: attributeValues.sortOrder,
			productCount: sql<number>`count(distinct ${productAttributeValues.productId})::int`,
		})
		.from(attributes)
		.innerJoin(attributeValues, eq(attributeValues.attributeId, attributes.id))
		.leftJoin(
			productAttributeValues,
			eq(productAttributeValues.attributeValueId, attributeValues.id),
		)
		.leftJoin(
			products,
			and(eq(products.id, productAttributeValues.productId), eq(products.status, "active")),
		)
		.where(inArray(attributes.slug, [...ATTRIBUTE_SLUGS]))
		.groupBy(
			attributes.slug,
			attributes.name,
			attributes.sortOrder,
			attributeValues.slug,
			attributeValues.name,
			attributeValues.sortOrder,
		)
		.orderBy(asc(attributes.sortOrder), asc(attributeValues.sortOrder))

	const grouped = new Map<string, AttributeFacet>()
	for (const r of rows) {
		const existing = grouped.get(r.attrSlug)
		const valueEntry = { slug: r.valueSlug, name: r.valueName, count: r.productCount ?? 0 }
		if (existing) {
			existing.values.push(valueEntry)
		} else {
			grouped.set(r.attrSlug, {
				slug: r.attrSlug,
				name: r.attrName,
				values: [valueEntry],
			})
		}
	}
	return Array.from(grouped.values())
}

export async function getProductBySlug(slug: string) {
	const [productRow] = await db
		.select()
		.from(products)
		.where(and(eq(products.slug, slug), eq(products.status, "active")))
	if (!productRow) return null

	const images = await db
		.select()
		.from(productImages)
		.where(eq(productImages.productId, productRow.id))
		.orderBy(asc(productImages.sortOrder))

	const attrRows = await db
		.select({
			attrSlug: attributes.slug,
			attrName: attributes.name,
			valueSlug: attributeValues.slug,
			valueName: attributeValues.name,
		})
		.from(productAttributeValues)
		.innerJoin(attributeValues, eq(attributeValues.id, productAttributeValues.attributeValueId))
		.innerJoin(attributes, eq(attributes.id, attributeValues.attributeId))
		.where(eq(productAttributeValues.productId, productRow.id))
		.orderBy(asc(attributes.sortOrder))

	return {
		...productRow,
		images,
		attributes: attrRows,
	}
}

export async function listRelated(productId: string, limit = 4): Promise<ProductCard[]> {
	// Related = products sharing at least one attribute value, active, excluding self.
	const sharedValues = await db
		.select({ valueId: productAttributeValues.attributeValueId })
		.from(productAttributeValues)
		.where(eq(productAttributeValues.productId, productId))

	const valueIds = sharedValues.map((r) => r.valueId)
	if (valueIds.length === 0) return []

	const candidates = await db
		.selectDistinct({ id: productAttributeValues.productId })
		.from(productAttributeValues)
		.where(inArray(productAttributeValues.attributeValueId, valueIds))

	const candidateIds = candidates.map((c) => c.id).filter((id) => id !== productId)
	if (candidateIds.length === 0) return []

	const rows = await db
		.select({
			id: products.id,
			slug: products.slug,
			name: products.name,
			shortDescription: products.shortDescription,
			priceAmount: products.priceAmount,
			priceCurrency: products.priceCurrency,
			stockQuantity: products.stockQuantity,
			imageUrl: productImages.url,
		})
		.from(products)
		.leftJoin(productImages, eq(productImages.id, products.primaryImageId))
		.where(and(inArray(products.id, candidateIds), eq(products.status, "active")))
		.orderBy(desc(products.createdAt))
		.limit(limit)

	return rows.map((r) => ({
		id: r.id,
		slug: r.slug,
		name: r.name,
		shortDescription: r.shortDescription,
		priceAmount: r.priceAmount,
		priceCurrency: r.priceCurrency,
		stockQuantity: r.stockQuantity,
		primaryImageUrl: r.imageUrl,
	}))
}
