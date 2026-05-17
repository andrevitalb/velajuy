import { PageHeader } from "@/components/admin/page-header"
import { requireOwner } from "@/lib/auth-guards"
import { getAllSettings } from "@/lib/admin/settings/queries"
import { notificationsSchema } from "@/lib/admin/settings/schema"
import { SettingsForm } from "./settings-form"

export default async function ConfigPage() {
	await requireOwner()
	const all = await getAllSettings()
	return (
		<>
			<PageHeader title="Configuración" />
			<SettingsForm
				defaults={{
					shop_name: String(all.shop_name ?? ""),
					contact_email: String(all.contact_email ?? ""),
					contact_phone: String(all.contact_phone ?? ""),
					social_instagram: String(all.social_instagram ?? ""),
					free_shipping_min_quantity: Number(all.free_shipping_min_quantity ?? 3),
					low_stock_threshold_default: Number(all.low_stock_threshold_default ?? 2),
					iva_default_rate: Number(all.iva_default_rate ?? 19),
					notifications: notificationsSchema.parse(all.notifications),
				}}
			/>
		</>
	)
}
