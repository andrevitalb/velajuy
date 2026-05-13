import {
	bigint,
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core"

export const shippingZones = pgTable(
	"shipping_zones",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		name: text("name").notNull(),
		country: text("country").notNull().default("CO"),
		department: text("department").notNull(),
		cities: jsonb("cities").$type<string[] | null>(),
		baseRateAmount: bigint("base_rate_amount", { mode: "number" }).notNull(),
		currencyCode: text("currency_code").notNull().default("COP"),
		courierDefault: text("courier_default"),
		allowsCod: boolean("allows_cod").notNull().default(false),
		isActive: boolean("is_active").notNull().default(true),
		sortOrder: integer("sort_order").notNull().default(0),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => ({
		byDepartment: index("shipping_zones_department_idx").on(t.department),
		byIsActive: index("shipping_zones_is_active_idx").on(t.isActive),
	}),
)

export type ShippingZone = typeof shippingZones.$inferSelect
export type NewShippingZone = typeof shippingZones.$inferInsert
