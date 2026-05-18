"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { createZone, updateZone, type ZoneInput } from "@/lib/admin/zones/actions"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/admin/field"

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
			<Field label="Nombre" htmlFor="zone-name">
				<input
					id="zone-name"
					value={form.name}
					onChange={(e) => update("name", e.target.value)}
					className={inputCls}
				/>
			</Field>
			<Field label="Departamento" htmlFor="zone-department">
				<input
					id="zone-department"
					value={form.department}
					onChange={(e) => update("department", e.target.value)}
					className={inputCls}
				/>
			</Field>
			<div className="sm:col-span-2">
				<Field
					label="Ciudades"
					htmlFor="zone-cities"
					helper="Separadas por coma; vacío = todo el departamento"
				>
					<input
						id="zone-cities"
						value={citiesText}
						onChange={(e) => setCitiesText(e.target.value)}
						className={inputCls}
					/>
				</Field>
			</div>
			<Field label="Tarifa base (pesos COP)" htmlFor="zone-base-rate">
				<input
					id="zone-base-rate"
					type="number"
					min={0}
					value={form.baseRatePesos}
					onChange={(e) => update("baseRatePesos", parseInt(e.target.value, 10) || 0)}
					className={inputCls}
				/>
			</Field>
			<Field label="Courier por defecto" htmlFor="zone-courier">
				<select
					id="zone-courier"
					value={form.courierDefault ?? ""}
					onChange={(e) => update("courierDefault", e.target.value || null)}
					className={inputCls}
				>
					<option value="">—</option>
					<option value="inter">Inter Rapidísimo</option>
					<option value="servientrega">Servientrega</option>
					<option value="envia">Envía</option>
				</select>
			</Field>
			<Field label="Sort order" htmlFor="zone-sort-order">
				<input
					id="zone-sort-order"
					type="number"
					value={form.sortOrder}
					onChange={(e) => update("sortOrder", parseInt(e.target.value, 10) || 0)}
					className={inputCls}
				/>
			</Field>
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
