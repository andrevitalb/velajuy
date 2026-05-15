import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { users } from "./users"

export const addresses = pgTable("addresses", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
	recipientName: text("recipient_name").notNull(),
	phone: text("phone").notNull(),
	country: text("country").notNull().default("CO"),
	department: text("department").notNull(),
	city: text("city").notNull(),
	line1: text("line1").notNull(),
	line2: text("line2"),
	neighborhood: text("neighborhood"),
	postalCode: text("postal_code"),
	notes: text("notes"),
	isDefault: boolean("is_default").notNull().default(false),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export type Address = typeof addresses.$inferSelect
export type NewAddress = typeof addresses.$inferInsert
