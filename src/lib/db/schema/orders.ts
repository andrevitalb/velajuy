import {
	bigint,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core"
import { addresses } from "./addresses"
import { products } from "./products"
import { users } from "./users"

export const orderStatus = pgEnum("order_status", [
	"pending_payment",
	"paid",
	"preparing",
	"shipped",
	"delivered",
	"cancelled",
	"failed",
])

export const paymentMethod = pgEnum("payment_method", [
	"wompi_card",
	"wompi_pse",
	"wompi_nequi",
	"wompi_bancolombia",
	"wompi_daviplata",
	"mp",
	"paypal",
	"contraentrega",
])

export const paymentStatus = pgEnum("payment_status", [
	"pending",
	"authorized",
	"paid",
	"pending_on_delivery",
	"failed",
])

export const shippingCourier = pgEnum("shipping_courier", ["inter", "servientrega", "envia"])

export const orders = pgTable("orders", {
	id: uuid("id").primaryKey().defaultRandom(),
	orderNumber: text("order_number").notNull().unique(),
	userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
	guestEmail: text("guest_email"),
	guestPhone: text("guest_phone"),
	status: orderStatus("status").notNull().default("pending_payment"),
	currencyCode: text("currency_code").notNull().default("COP"),
	subtotalAmount: bigint("subtotal_amount", { mode: "number" }).notNull(),
	shippingAmount: bigint("shipping_amount", { mode: "number" }).notNull(),
	taxAmount: bigint("tax_amount", { mode: "number" }).notNull(),
	discountAmount: bigint("discount_amount", { mode: "number" }).notNull().default(0),
	totalAmount: bigint("total_amount", { mode: "number" }).notNull(),
	paymentMethod: paymentMethod("payment_method"),
	paymentStatus: paymentStatus("payment_status").notNull().default("pending"),
	shippingAddressId: uuid("shipping_address_id").references(() => addresses.id),
	billingAddressId: uuid("billing_address_id").references(() => addresses.id),
	shippingCourier: shippingCourier("shipping_courier"),
	shippingZoneId: uuid("shipping_zone_id"),
	trackingNumber: text("tracking_number"),
	notes: text("notes"),
	placedAt: timestamp("placed_at", { withTimezone: true }).notNull().defaultNow(),
	paidAt: timestamp("paid_at", { withTimezone: true }),
	shippedAt: timestamp("shipped_at", { withTimezone: true }),
	deliveredAt: timestamp("delivered_at", { withTimezone: true }),
	cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
	dianInvoiceId: text("dian_invoice_id"),
	dianStatus: text("dian_status"),
	dianProvider: text("dian_provider"),
	dianPayload: jsonb("dian_payload"),
	taxBreakdown: jsonb("tax_breakdown"),
})

export const orderItems = pgTable("order_items", {
	id: uuid("id").primaryKey().defaultRandom(),
	orderId: uuid("order_id")
		.notNull()
		.references(() => orders.id, { onDelete: "cascade" }),
	productId: uuid("product_id")
		.notNull()
		.references(() => products.id, { onDelete: "restrict" }),
	nameSnapshot: text("name_snapshot").notNull(),
	imageSnapshotUrl: text("image_snapshot_url"),
	quantity: integer("quantity").notNull(),
	unitPriceAmount: bigint("unit_price_amount", { mode: "number" }).notNull(),
	currencyCode: text("currency_code").notNull(),
	lineTotalAmount: bigint("line_total_amount", { mode: "number" }).notNull(),
	dianTaxRateSnapshot: integer("dian_tax_rate_snapshot").notNull(),
})

export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert
export type OrderItem = typeof orderItems.$inferSelect
export type NewOrderItem = typeof orderItems.$inferInsert
