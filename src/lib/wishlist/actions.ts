"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { wishlistItems } from "@/lib/db/schema"
import { requireSession } from "@/lib/auth-guards"

export async function addToWishlist(productId: string): Promise<{ inWishlist: true }> {
	const session = await requireSession()
	await db
		.insert(wishlistItems)
		.values({ userId: session.user.id, productId })
		.onConflictDoNothing()
	revalidatePath("/cuenta/wishlist")
	return { inWishlist: true }
}

export async function removeFromWishlist(productId: string): Promise<{ inWishlist: false }> {
	const session = await requireSession()
	await db
		.delete(wishlistItems)
		.where(and(eq(wishlistItems.userId, session.user.id), eq(wishlistItems.productId, productId)))
	revalidatePath("/cuenta/wishlist")
	return { inWishlist: false }
}
