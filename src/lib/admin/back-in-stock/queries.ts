import { desc, eq, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { backInStockSubscriptions, products } from "@/lib/db/schema"

export async function listSubscriptionsGroupedByProduct() {
	return db
		.select({
			productId: products.id,
			productName: products.name,
			stock: products.stockQuantity,
			pendingCount:
				sql<number>`COUNT(*) FILTER (WHERE ${backInStockSubscriptions.notifiedAt} IS NULL)`.mapWith(
					Number,
				),
			notifiedCount:
				sql<number>`COUNT(*) FILTER (WHERE ${backInStockSubscriptions.notifiedAt} IS NOT NULL)`.mapWith(
					Number,
				),
			latest: sql<Date>`MAX(${backInStockSubscriptions.createdAt})`,
		})
		.from(backInStockSubscriptions)
		.innerJoin(products, eq(products.id, backInStockSubscriptions.productId))
		.groupBy(products.id, products.name, products.stockQuantity)
		.orderBy(desc(sql`MAX(${backInStockSubscriptions.createdAt})`))
}

export async function listSubscriptionsForProduct(productId: string) {
	return db
		.select()
		.from(backInStockSubscriptions)
		.where(eq(backInStockSubscriptions.productId, productId))
		.orderBy(desc(backInStockSubscriptions.createdAt))
}
