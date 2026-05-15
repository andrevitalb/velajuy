import {
	bigint,
	index,
	jsonb,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core"
import { orders } from "./orders"

export const payments = pgTable(
	"payments",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		orderId: uuid("order_id")
			.notNull()
			.references(() => orders.id, { onDelete: "cascade" }),
		provider: text("provider").notNull(),
		providerRef: text("provider_ref").notNull(),
		status: text("status").notNull(),
		amountAmount: bigint("amount_amount", { mode: "number" }).notNull(),
		currencyCode: text("currency_code").notNull(),
		rawPayload: jsonb("raw_payload"),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => ({
		byOrder: index("payments_order_idx").on(t.orderId),
		providerRefIdx: uniqueIndex("payments_provider_ref_idx").on(t.provider, t.providerRef),
	}),
)

export const webhookEvents = pgTable(
	"webhook_events",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		provider: text("provider").notNull(),
		eventId: text("event_id").notNull(),
		type: text("type").notNull(),
		payload: jsonb("payload"),
		receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
		processedAt: timestamp("processed_at", { withTimezone: true }),
		status: text("status").notNull().default("received"),
	},
	(t) => ({
		providerEventIdx: uniqueIndex("webhook_provider_event_idx").on(t.provider, t.eventId),
		byStatus: index("webhook_events_status_idx").on(t.status),
	}),
)

export type Payment = typeof payments.$inferSelect
export type NewPayment = typeof payments.$inferInsert
export type WebhookEvent = typeof webhookEvents.$inferSelect
export type NewWebhookEvent = typeof webhookEvents.$inferInsert
