import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { products } from "./products"
import { users } from "./users"

export const backInStockSubscriptions = pgTable(
	"back_in_stock_subscriptions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		productId: uuid("product_id")
			.notNull()
			.references(() => products.id, { onDelete: "cascade" }),
		email: text("email").notNull(),
		userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
		notifiedAt: timestamp("notified_at", { withTimezone: true }),
		unsubscribeToken: text("unsubscribe_token").notNull().unique(),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => ({
		byProduct: index("back_in_stock_subscriptions_product_idx").on(t.productId),
		byEmail: index("back_in_stock_subscriptions_email_idx").on(t.email),
	}),
)

export type BackInStockSubscription = typeof backInStockSubscriptions.$inferSelect
export type NewBackInStockSubscription = typeof backInStockSubscriptions.$inferInsert
