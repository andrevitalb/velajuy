import { z } from "zod"

export const notificationEventSchema = z.object({
	enabled: z.boolean(),
	frequency: z.enum(["immediate", "daily", "off"]),
	email: z.string().email().nullable(),
})

export const notificationsSchema = z.object({
	new_order: notificationEventSchema,
	payment_received: notificationEventSchema,
	stock_low: notificationEventSchema,
	cod_ready: notificationEventSchema,
})

export type Notifications = z.infer<typeof notificationsSchema>

export const settingsSchema = z.object({
	shop_name: z.string().min(1),
	contact_email: z.string().email(),
	contact_phone: z.string().min(1),
	social_instagram: z.string(),
	free_shipping_min_quantity: z.number().int().min(0).max(99),
	low_stock_threshold_default: z.number().int().min(0).max(999),
	iva_default_rate: z.number().int().min(0).max(99),
	notifications: notificationsSchema,
})

export type Settings = z.infer<typeof settingsSchema>
