"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { createZone, updateZone, type ZoneInput } from "@/lib/admin/zones/actions"
import { Button } from "@/components/ui/button"

type Mode = { kind: "create" } | { kind: "edit"; id: string }

export function ZoneForm({
	mode,
	defaults,
	onSaved,
}: {
	mode: Mode
	defaults: ZoneInput
	onSaved: () => void
}) {
	const [form, setForm] = useState(defaults)
	const [citiesText, setCitiesText] = useState((defaults.cities ?? []).join(", "))
	const [pending, startTransition] = useTransition()

	function update<K extends keyof ZoneInput>(key: K, value: ZoneInput[K]) {
		setForm((f) => ({ ...f, [key]: value }))
	}

	function submit(e: React.FormEvent) {
		e.preventDefault()
		const cities =
			citiesText.trim() === ""
				? null
				: citiesText
						.split(",")
						.map((s) => s.trim())
						.filter(Boolean)
		const payload: ZoneInput = { ...form, cities }
		startTransition(async () => {
			try {
				if (mode.kind === "create") await createZone(payload)
				else await updateZone(mode.id, payload)
				toast.success("Guardado")
				onSaved()
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Error")
			}
		})
	}

	return (
		<form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
			<L label="Nombre">
				<input
					value={form.name}
					onChange={(e) => update("name", e.target.value)}
					className={inputCls}
				/>
			</L>
			<L label="Departamento">
				<input
					value={form.department}
					onChange={(e) => update("department", e.target.value)}
					className={inputCls}
				/>
			</L>
			<L label="Ciudades (coma; vacío = todo el depto)" className="sm:col-span-2">
				<input
					value={citiesText}
					onChange={(e) => setCitiesText(e.target.value)}
					className={inputCls}
				/>
			</L>
			<L label="Tarifa base (pesos COP)">
				<input
					type="number"
					min={0}
					value={form.baseRatePesos}
					onChange={(e) => update("baseRatePesos", parseInt(e.target.value, 10) || 0)}
					className={inputCls}
				/>
			</L>
			<L label="Courier por defecto">
				<select
					value={form.courierDefault ?? ""}
					onChange={(e) => update("courierDefault", e.target.value || null)}
					className={inputCls}
				>
					<option value="">—</option>
					<option value="inter">Inter Rapidísimo</option>
					<option value="servientrega">Servientrega</option>
					<option value="envia">Envía</option>
				</select>
			</L>
			<L label="Sort order">
				<input
					type="number"
					value={form.sortOrder}
					onChange={(e) => update("sortOrder", parseInt(e.target.value, 10) || 0)}
					className={inputCls}
				/>
			</L>
			<label className="flex items-center gap-2 text-sm text-velajuy-wine">
				<input
					type="checkbox"
					checked={form.allowsCod}
					onChange={(e) => update("allowsCod", e.target.checked)}
				/>
				Permite contra entrega
			</label>
			<label className="flex items-center gap-2 text-sm text-velajuy-wine">
				<input
					type="checkbox"
					checked={form.isActive}
					onChange={(e) => update("isActive", e.target.checked)}
				/>
				Activa
			</label>
			<div className="sm:col-span-2">
				<Button type="submit" size="sm" pending={pending}>
					{pending ? "Guardando…" : "Guardar"}
				</Button>
			</div>
		</form>
	)
}

const inputCls = "w-full rounded-lg border border-velajuy-wine/20 px-3 py-2 text-sm"

function L({
	label,
	className,
	children,
}: {
	label: string
	className?: string
	children: React.ReactNode
}) {
	return (
		<label className={`block text-sm text-velajuy-wine ${className ?? ""}`}>
			<span className="mb-1 block font-medium">{label}</span>
			{children}
		</label>
	)
}
