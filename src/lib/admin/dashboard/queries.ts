import { and, count, eq, gte, lt, sum } from "drizzle-orm"
import { db } from "@/lib/db"
import { orders, products } from "@/lib/db/schema"

function startOfDay(d: Date): Date {
	const x = new Date(d)
	x.setHours(0, 0, 0, 0)
	return x
}

function startOfWeek(d: Date): Date {
	const x = startOfDay(d)
	x.setDate(x.getDate() - x.getDay())
	return x
}

export async function todayOrders(): Promise<{ count: number; total: number }> {
	const today = startOfDay(new Date())
	const tomorrow = new Date(today)
	tomorrow.setDate(tomorrow.getDate() + 1)
	const [row] = await db
		.select({ count: count(), total: sum(orders.totalAmount) })
		.from(orders)
		.where(and(gte(orders.placedAt, today), lt(orders.placedAt, tomorrow)))
	return { count: Number(row.count ?? 0), total: Number(row.total ?? 0) }
}

export async function weekRevenue(): Promise<number> {
	const start = startOfWeek(new Date())
	const [row] = await db
		.select({ total: sum(orders.totalAmount) })
		.from(orders)
		.where(and(gte(orders.placedAt, start), eq(orders.paymentStatus, "paid")))
	return Number(row.total ?? 0)
}

export async function lowStock(limit = 10) {
	return db
		.select({
			id: products.id,
			name: products.name,
			stock: products.stockQuantity,
			threshold: products.lowStockThreshold,
		})
		.from(products)
		.where(eq(products.status, "active"))
		.orderBy(products.stockQuantity)
		.limit(limit)
}

export async function pendingShipments(limit = 10) {
	return db
		.select({
			id: orders.id,
			orderNumber: orders.orderNumber,
			placedAt: orders.placedAt,
			totalAmount: orders.totalAmount,
		})
		.from(orders)
		.where(eq(orders.status, "preparing"))
		.orderBy(orders.placedAt)
		.limit(limit)
}
