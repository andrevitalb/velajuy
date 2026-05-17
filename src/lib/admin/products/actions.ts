"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { productAttributeValues, productImages, products } from "@/lib/db/schema"
import { requireOwner, requireAdmin } from "@/lib/auth-guards"
import { productFormSchema, type ProductFormInput } from "./schema"

export async function createProduct(input: ProductFormInput): Promise<{ id: string }> {
	await requireOwner()
	const data = productFormSchema.parse(input)
	const [row] = await db
		.insert(products)
		.values({
			slug: data.slug,
			name: data.name,
			shortDescription: data.shortDescription ?? null,
			description: data.description ?? null,
			status: data.status,
			priceAmount: data.pricePesos * 100,
			priceCurrency: "COP",
			weightGrams: data.weightGrams,
			skuCode: data.skuCode ?? null,
			lowStockThreshold: data.lowStockThreshold,
			dianTaxRate: data.dianTaxRate,
		})
		.returning({ id: products.id })

	if (data.attributeValueIds.length > 0) {
		await db.insert(productAttributeValues).values(
			data.attributeValueIds.map((attributeValueId) => ({
				productId: row.id,
				attributeValueId,
			})),
		)
	}
	revalidatePath("/admin/productos")
	return { id: row.id }
}

export async function updateProduct(productId: string, input: ProductFormInput): Promise<void> {
	await requireOwner()
	const data = productFormSchema.parse(input)
	await db
		.update(products)
		.set({
			slug: data.slug,
			name: data.name,
			shortDescription: data.shortDescription ?? null,
			description: data.description ?? null,
			status: data.status,
			priceAmount: data.pricePesos * 100,
			weightGrams: data.weightGrams,
			skuCode: data.skuCode ?? null,
			lowStockThreshold: data.lowStockThreshold,
			dianTaxRate: data.dianTaxRate,
			updatedAt: new Date(),
		})
		.where(eq(products.id, productId))

	await db.delete(productAttributeValues).where(eq(productAttributeValues.productId, productId))
	if (data.attributeValueIds.length > 0) {
		await db.insert(productAttributeValues).values(
			data.attributeValueIds.map((attributeValueId) => ({
				productId,
				attributeValueId,
			})),
		)
	}
	revalidatePath(`/admin/productos/${productId}`)
	revalidatePath("/admin/productos")
}

export async function archiveProduct(productId: string): Promise<void> {
	await requireOwner()
	await db.update(products).set({ status: "archived" }).where(eq(products.id, productId))
	revalidatePath("/admin/productos")
}

export async function attachUploadedImage(input: {
	productId: string
	url: string
	altText?: string | null
	width?: number | null
	height?: number | null
}): Promise<{ id: string }> {
	await requireAdmin()
	const existing = await db
		.select({ id: productImages.id })
		.from(productImages)
		.where(eq(productImages.productId, input.productId))
	const sortOrder = existing.length
	const [row] = await db
		.insert(productImages)
		.values({
			productId: input.productId,
			url: input.url,
			altText: input.altText ?? null,
			width: input.width ?? null,
			height: input.height ?? null,
			sortOrder,
		})
		.returning({ id: productImages.id })
	if (existing.length === 0) {
		await db
			.update(products)
			.set({ primaryImageId: row.id })
			.where(eq(products.id, input.productId))
	}
	revalidatePath(`/admin/productos/${input.productId}`)
	return { id: row.id }
}

export async function reorderImages(productId: string, orderedIds: string[]): Promise<void> {
	await requireAdmin()
	for (let i = 0; i < orderedIds.length; i++) {
		await db
			.update(productImages)
			.set({ sortOrder: i })
			.where(and(eq(productImages.id, orderedIds[i]), eq(productImages.productId, productId)))
	}
	if (orderedIds.length > 0) {
		await db
			.update(products)
			.set({ primaryImageId: orderedIds[0] })
			.where(eq(products.id, productId))
	}
	revalidatePath(`/admin/productos/${productId}`)
}

export async function deleteImage(productId: string, imageId: string): Promise<void> {
	await requireAdmin()
	await db
		.delete(productImages)
		.where(and(eq(productImages.id, imageId), eq(productImages.productId, productId)))
	const remaining = await db
		.select()
		.from(productImages)
		.where(eq(productImages.productId, productId))
		.orderBy(productImages.sortOrder)
	const newPrimary = remaining[0]?.id ?? null
	await db.update(products).set({ primaryImageId: newPrimary }).where(eq(products.id, productId))
	revalidatePath(`/admin/productos/${productId}`)
}
