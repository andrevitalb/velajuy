import { sendEmail } from "@/lib/email/client"
import { getNotifications } from "@/lib/admin/settings/queries"

export type AdminEvent = "new_order" | "payment_received" | "stock_low" | "cod_ready"

type Payload = { subject: string; html: string; text: string }

export async function sendAdminNotification(
	event: AdminEvent,
	payload: Payload,
	options?: { ownerEmail?: string },
): Promise<void> {
	const config = await getNotifications()
	const eventConfig = config[event]
	if (!eventConfig?.enabled) return
	if (eventConfig.frequency === "off") return
	// TODO: "daily" frequency requires a Phase 3 cron — treat as immediate for now.
	const to = eventConfig.email ?? options?.ownerEmail
	if (!to) return
	await sendEmail({ to, subject: payload.subject, html: payload.html, text: payload.text })
}
