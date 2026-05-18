"use client"

import { useState, useTransition } from "react"
import type { ReactNode } from "react"
import { toast } from "sonner"
import { updateSetting } from "@/lib/admin/settings/actions"
import type { Notifications } from "@/lib/admin/settings/schema"
import { Button } from "@/components/ui/button"

type Defaults = {
	shop_name: string
	contact_email: string
	contact_phone: string
	social_instagram: string
	free_shipping_min_quantity: number
	low_stock_threshold_default: number
	iva_default_rate: number
	notifications: Notifications
}

const EVENTS: { key: keyof Notifications; label: string }[] = [
	{ key: "new_order", label: "Nuevo pedido" },
	{ key: "payment_received", label: "Pago recibido" },
	{ key: "stock_low", label: "Stock bajo" },
	{ key: "cod_ready", label: "COD listo para confirmar" },
]

export function SettingsForm({ defaults }: { defaults: Defaults }) {
	const [state, setState] = useState(defaults)
	const [pending, startTransition] = useTransition()

	function save() {
		startTransition(async () => {
			try {
				await Promise.all([
					updateSetting("shop_name", state.shop_name),
					updateSetting("contact_email", state.contact_email),
					updateSetting("contact_phone", state.contact_phone),
					updateSetting("social_instagram", state.social_instagram),
					updateSetting("free_shipping_min_quantity", state.free_shipping_min_quantity),
					updateSetting("low_stock_threshold_default", state.low_stock_threshold_default),
					updateSetting("iva_default_rate", state.iva_default_rate),
					updateSetting("notifications", state.notifications),
				])
				toast.success("Configuración guardada")
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Error")
			}
		})
	}

	return (
		<div className="space-y-6">
			<Section title="Tienda">
				<T
					label="Nombre"
					value={state.shop_name}
					onChange={(v) => setState({ ...state, shop_name: v })}
				/>
				<T
					label="Email de contacto"
					value={state.contact_email}
					onChange={(v) => setState({ ...state, contact_email: v })}
				/>
				<T
					label="Teléfono"
					value={state.contact_phone}
					onChange={(v) => setState({ ...state, contact_phone: v })}
				/>
				<T
					label="Instagram"
					value={state.social_instagram}
					onChange={(v) => setState({ ...state, social_instagram: v })}
				/>
			</Section>
			<Section title="Comercio">
				<N
					label="Cantidad mínima para envío gratis"
					value={state.free_shipping_min_quantity}
					onChange={(v) => setState({ ...state, free_shipping_min_quantity: v })}
				/>
				<N
					label="Umbral de stock bajo (default)"
					value={state.low_stock_threshold_default}
					onChange={(v) => setState({ ...state, low_stock_threshold_default: v })}
				/>
				<N
					label="IVA por defecto (%)"
					value={state.iva_default_rate}
					onChange={(v) => setState({ ...state, iva_default_rate: v })}
				/>
			</Section>
			<Section title="Notificaciones">
				{EVENTS.map(({ key, label }) => {
					const cfg = state.notifications[key]
					return (
						<div key={key} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-4">
							<label className="flex items-center gap-2 text-sm text-velajuy-wine">
								<input
									type="checkbox"
									checked={cfg.enabled}
									onChange={(e) =>
										setState({
											...state,
											notifications: {
												...state.notifications,
												[key]: { ...cfg, enabled: e.target.checked },
											},
										})
									}
								/>
								{label}
							</label>
							<select
								value={cfg.frequency}
								onChange={(e) =>
									setState({
										...state,
										notifications: {
											...state.notifications,
											[key]: { ...cfg, frequency: e.target.value as typeof cfg.frequency },
										},
									})
								}
								className="rounded-lg border border-velajuy-wine/20 px-3 py-2 text-sm"
							>
								<option value="immediate">Inmediato</option>
								<option value="daily">Resumen diario</option>
								<option value="off">Apagado</option>
							</select>
							<input
								placeholder="Email destino (opcional)"
								value={cfg.email ?? ""}
								onChange={(e) =>
									setState({
										...state,
										notifications: {
											...state.notifications,
											[key]: { ...cfg, email: e.target.value || null },
										},
									})
								}
								className="rounded-lg border border-velajuy-wine/20 px-3 py-2 text-sm sm:col-span-2"
							/>
						</div>
					)
				})}
			</Section>
			<Button type="button" size="sm" pending={pending} onClick={save}>
				{pending ? "Guardando…" : "Guardar configuración"}
			</Button>
		</div>
	)
}

function Section({ title, children }: { title: string; children: ReactNode }) {
	return (
		<section className="rounded-2xl border border-velajuy-wine/10 bg-white p-5">
			<h2 className="mb-4 text-lg font-bold text-velajuy-wine">{title}</h2>
			<div className="space-y-3">{children}</div>
		</section>
	)
}

function T({
	label,
	value,
	onChange,
}: {
	label: string
	value: string
	onChange: (v: string) => void
}) {
	return (
		<label className="block text-sm text-velajuy-wine">
			<span className="mb-1 block font-medium">{label}</span>
			<input
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"
			/>
		</label>
	)
}

function N({
	label,
	value,
	onChange,
}: {
	label: string
	value: number
	onChange: (v: number) => void
}) {
	return (
		<label className="block text-sm text-velajuy-wine">
			<span className="mb-1 block font-medium">{label}</span>
			<input
				type="number"
				min={0}
				value={value}
				onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
				className="w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"
			/>
		</label>
	)
}
