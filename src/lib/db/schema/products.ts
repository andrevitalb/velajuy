import { bigint, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const productStatus = pgEnum("product_status", ["draft", "active", "archived"])

export const products = pgTable("products", {
	id: uuid("id").primaryKey().defaultRandom(),
	slug: text("slug").notNull().unique(),
	name: text("name").notNull(),
	shortDescription: text("short_description"),
	description: text("description"),
	status: productStatus("status").notNull().default("draft"),
	priceAmount: bigint("price_amount", { mode: "number" }).notNull(),
	priceCurrency: text("price_currency").notNull().default("COP"),
	weightGrams: integer("weight_grams"),
	primaryImageId: uuid("primary_image_id"),
	stockQuantity: integer("stock_quantity").notNull().default(0),
	lowStockThreshold: integer("low_stock_threshold").notNull().default(2),
	skuCode: text("sku_code"),
	dianTaxRate: integer("dian_tax_rate").notNull().default(19),
	dianClassification: text("dian_classification"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
