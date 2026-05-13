import {
	index,
	integer,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core"
import { products } from "./products"

export const attributes = pgTable("attributes", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(),
	sortOrder: integer("sort_order").notNull().default(0),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const attributeValues = pgTable(
	"attribute_values",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		attributeId: uuid("attribute_id")
			.notNull()
			.references(() => attributes.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		slug: text("slug").notNull(),
		sortOrder: integer("sort_order").notNull().default(0),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => ({
		attributeSlugIdx: uniqueIndex("attribute_values_attribute_slug_idx").on(t.attributeId, t.slug),
	}),
)

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
		byAttributeValue: index("product_attribute_values_value_idx").on(t.attributeValueId),
	}),
)

export type Attribute = typeof attributes.$inferSelect
export type NewAttribute = typeof attributes.$inferInsert
export type AttributeValue = typeof attributeValues.$inferSelect
export type NewAttributeValue = typeof attributeValues.$inferInsert
export type ProductAttributeValue = typeof productAttributeValues.$inferSelect
export type NewProductAttributeValue = typeof productAttributeValues.$inferInsert
