import { and, asc, count, desc, eq, gte, lt, type SQL } from "drizzle-orm"
import { db } from "@/lib/db"
import { orderItems, orders, type Order } from "@/lib/db/schema"

export type OrderListFilters = {
	status?: Order["status"]
	paymentMethod?: NonNullable<Order["paymentMethod"]>
	codOnly?: boolean
	from?: Date
	to?: Date
}

function buildOrdersWhere(filters: OrderListFilters): SQL | undefined {
	const where: SQL[] = []
	if (filters.status) where.push(eq(orders.status, filters.status))
	if (filters.paymentMethod) where.push(eq(orders.paymentMethod, filters.paymentMethod))
	if (filters.codOnly) where.push(eq(orders.paymentMethod, "contraentrega"))
	if (filters.from) where.push(gte(orders.placedAt, filters.from))
	if (filters.to) where.push(lt(orders.placedAt, filters.to))
	return where.length ? and(...where) : undefined
}

export async function listOrders(filters: OrderListFilters = {}, limit = 100) {
	return db
		.select()
		.from(orders)
		.where(buildOrdersWhere(filters))
		.orderBy(desc(orders.placedAt))
		.limit(limit)
}

export type OrdersSortField = "orderNumber" | "placedAt" | "status" | "totalAmount"

const ORDERS_SORT_MAP = {
	orderNumber: orders.orderNumber,
	placedAt: orders.placedAt,
	status: orders.status,
	totalAmount: orders.totalAmount,
} as const

export async function listOrdersPaginated(
	filters: OrderListFilters = {},
	options: {
		sort?: OrdersSortField
		dir?: "asc" | "desc"
		page?: number
		perPage?: number
	} = {},
) {
	const sortField = options.sort && ORDERS_SORT_MAP[options.sort] ? options.sort : "placedAt"
	const dir = options.dir === "asc" ? "asc" : "desc"
	const perPage = Math.max(1, options.perPage ?? 20)
	const page = Math.max(1, options.page ?? 1)
	const where = buildOrdersWhere(filters)
	const col = ORDERS_SORT_MAP[sortField]
	const orderExpr = dir === "asc" ? asc(col) : desc(col)
	const [rows, totalRows] = await Promise.all([
		db
			.select()
			.from(orders)
			.where(where)
			.orderBy(orderExpr)
			.limit(perPage)
			.offset((page - 1) * perPage),
		db.select({ value: count() }).from(orders).where(where),
	])
	return { rows, total: Number(totalRows[0]?.value ?? 0) }
}

export async function getOrderByNumber(orderNumber: string) {
	const [row] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber))
	if (!row) return null
	const items = await db.select().from(orderItems).where(eq(orderItems.orderId, row.id))
	return { ...row, items }
}
