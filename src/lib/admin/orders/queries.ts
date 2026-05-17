import { and, desc, eq, gte, lt, type SQL } from "drizzle-orm"
import { db } from "@/lib/db"
import { orderItems, orders, type Order } from "@/lib/db/schema"

export type OrderListFilters = {
	status?: Order["status"]
	paymentMethod?: NonNullable<Order["paymentMethod"]>
	codOnly?: boolean
	from?: Date
	to?: Date
}

export async function listOrders(filters: OrderListFilters = {}, limit = 100) {
	const where: SQL[] = []
	if (filters.status) where.push(eq(orders.status, filters.status))
	if (filters.paymentMethod) where.push(eq(orders.paymentMethod, filters.paymentMethod))
	if (filters.codOnly) where.push(eq(orders.paymentMethod, "contraentrega"))
	if (filters.from) where.push(gte(orders.placedAt, filters.from))
	if (filters.to) where.push(lt(orders.placedAt, filters.to))
	return db
		.select()
		.from(orders)
		.where(where.length ? and(...where) : undefined)
		.orderBy(desc(orders.placedAt))
		.limit(limit)
}

export async function getOrderByNumber(orderNumber: string) {
	const [row] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber))
	if (!row) return null
	const items = await db.select().from(orderItems).where(eq(orderItems.orderId, row.id))
	return { ...row, items }
}
