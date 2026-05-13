import { index, pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core"
import { products } from "./products"
import { users } from "./users"

export const wishlistItems = pgTable(
	"wishlist_items",
	{
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		productId: uuid("product_id")
			.notNull()
			.references(() => products.id, { onDelete: "cascade" }),
		addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.userId, t.productId] }),
		byProduct: index("wishlist_items_product_idx").on(t.productId),
	}),
)

export type WishlistItem = typeof wishlistItems.$inferSelect
export type NewWishlistItem = typeof wishlistItems.$inferInsert
