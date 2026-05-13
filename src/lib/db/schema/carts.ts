import { bigint, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { products } from "./products"
import { users } from "./users"

export const carts = pgTable("carts", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
	sessionToken: text("session_token").unique(),
	currencyCode: text("currency_code").notNull().default("COP"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	expiresAt: timestamp("expires_at", { withTimezone: true }),
})

export const cartItems = pgTable("cart_items", {
	id: uuid("id").primaryKey().defaultRandom(),
	cartId: uuid("cart_id")
		.notNull()
		.references(() => carts.id, { onDelete: "cascade" }),
	productId: uuid("product_id")
		.notNull()
		.references(() => products.id, { onDelete: "restrict" }),
	quantity: integer("quantity").notNull(),
	unitPriceSnapshot: bigint("unit_price_snapshot", { mode: "number" }).notNull(),
	currencyCode: text("currency_code").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export type Cart = typeof carts.$inferSelect
export type NewCart = typeof carts.$inferInsert
export type CartItem = typeof cartItems.$inferSelect
export type NewCartItem = typeof cartItems.$inferInsert
