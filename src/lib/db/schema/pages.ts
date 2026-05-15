import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const pages = pgTable(
	"pages",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		slug: text("slug").notNull().unique(),
		title: text("title").notNull(),
		body: jsonb("body"),
		metaDescription: text("meta_description"),
		ogImageUrl: text("og_image_url"),
		publishedAt: timestamp("published_at", { withTimezone: true }),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => ({
		byPublishedAt: index("pages_published_at_idx").on(t.publishedAt),
	}),
)

export type Page = typeof pages.$inferSelect
export type NewPage = typeof pages.$inferInsert
