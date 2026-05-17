import { db } from "@/lib/db"
import { settings } from "@/lib/db/schema"
import { type Notifications, notificationsSchema } from "./schema"

export async function getAllSettings(): Promise<Record<string, unknown>> {
	const rows = await db.select().from(settings)
	return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}

export async function getNotifications(): Promise<Notifications> {
	const all = await getAllSettings()
	return notificationsSchema.parse(all.notifications)
}

export async function getOwnerEmail(): Promise<string> {
	const all = await getAllSettings()
	return typeof all.contact_email === "string" ? all.contact_email : "owner@velajuy.com"
}
