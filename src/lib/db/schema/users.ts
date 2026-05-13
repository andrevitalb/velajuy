import { pgEnum, pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core"

export const userRole = pgEnum("user_role", ["customer", "staff", "owner"])

export const users = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull().default(false),
	name: text("name"),
	phone: text("phone"),
	role: userRole("role").notNull().default("customer"),
	image: text("image"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
