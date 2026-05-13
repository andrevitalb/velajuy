import { index, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const fxRates = pgTable(
	"fx_rates",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		baseCurrency: text("base_currency").notNull(),
		quoteCurrency: text("quote_currency").notNull(),
		rate: numeric("rate", { precision: 18, scale: 8 }).notNull(),
		effectiveAt: timestamp("effective_at", { withTimezone: true }).notNull(),
		source: text("source").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => ({
		byPairEffectiveAt: index("fx_rates_pair_effective_at_idx").on(
			t.baseCurrency,
			t.quoteCurrency,
			t.effectiveAt,
		),
	}),
)

export type FxRate = typeof fxRates.$inferSelect
export type NewFxRate = typeof fxRates.$inferInsert
