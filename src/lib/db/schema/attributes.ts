import { integer, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { products } from "./products"

export const attributes = pgTable("attributes", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(),
	sortOrder: integer("sort_order").notNull().default(0),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const attributeValues = pgTable("attribute_values", {
	id: uuid("id").primaryKey().defaultRandom(),
	attributeId: uuid("attribute_id")
		.notNull()
		.references(() => attributes.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	slug: text("slug").notNull(),
	sortOrder: integer("sort_order").notNull().default(0),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const productAttributeValues = pgTable(
	"product_attribute_values",
	{
		productId: uuid("product_id")
			.notNull()
			.references(() => products.id, { onDelete: "cascade" }),
		attributeValueId: uuid("attribute_value_id")
			.notNull()
			.references(() => attributeValues.id, { onDelete: "cascade" }),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.productId, t.attributeValueId] }),
	}),
)
