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
