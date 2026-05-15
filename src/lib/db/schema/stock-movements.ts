import { index, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { orders } from "./orders"
import { products } from "./products"
import { users } from "./users"

export const stockMovementReason = pgEnum("stock_movement_reason", [
	"sale",
	"cancellation",
	"restock",
	"adjustment",
	"return",
])

export const stockMovements = pgTable(
	"stock_movements",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		productId: uuid("product_id")
			.notNull()
			.references(() => products.id, { onDelete: "restrict" }),
		delta: integer("delta").notNull(),
		reason: stockMovementReason("reason").notNull(),
		orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
		staffId: uuid("staff_id").references(() => users.id, { onDelete: "set null" }),
		notes: text("notes"),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => ({
		byProduct: index("stock_movements_product_idx").on(t.productId),
		byOrder: index("stock_movements_order_idx").on(t.orderId),
		byCreatedAt: index("stock_movements_created_at_idx").on(t.createdAt),
	}),
)

export type StockMovement = typeof stockMovements.$inferSelect
export type NewStockMovement = typeof stockMovements.$inferInsert
