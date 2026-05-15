import { and, desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { productImages, products, wishlistItems } from "@/lib/db/schema"

export async function isInWishlist(userId: string, productId: string): Promise<boolean> {
	const [row] = await db
		.select({ productId: wishlistItems.productId })
		.from(wishlistItems)
		.where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId)))
		.limit(1)
	return !!row
}

export async function listUserWishlist(userId: string) {
	return db
		.select({
			id: products.id,
			slug: products.slug,
			name: products.name,
			shortDescription: products.shortDescription,
			priceAmount: products.priceAmount,
			priceCurrency: products.priceCurrency,
			stockQuantity: products.stockQuantity,
			primaryImageUrl: productImages.url,
			addedAt: wishlistItems.addedAt,
		})
		.from(wishlistItems)
		.innerJoin(products, eq(products.id, wishlistItems.productId))
		.leftJoin(productImages, eq(productImages.id, products.primaryImageId))
		.where(eq(wishlistItems.userId, userId))
		.orderBy(desc(wishlistItems.addedAt))
}
