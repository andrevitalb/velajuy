import { desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { products, stockMovements } from "@/lib/db/schema"

export async function listStock() {
	return db
		.select({
			id: products.id,
			name: products.name,
			skuCode: products.skuCode,
			stockQuantity: products.stockQuantity,
			lowStockThreshold: products.lowStockThreshold,
		})
		.from(products)
		.orderBy(products.name)
}

export async function getStockHistory(productId: string, limit = 50) {
	return db
		.select()
		.from(stockMovements)
		.where(eq(stockMovements.productId, productId))
		.orderBy(desc(stockMovements.createdAt))
		.limit(limit)
}
