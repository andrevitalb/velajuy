"use client"

import { useState, useEffect, useTransition } from "react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/page-header"
import { deactivateZone } from "@/lib/admin/zones/actions"
import { ZoneForm } from "./zone-form"

type Zone = {
	id: string
	name: string
	department: string
	cities: string[] | null
	baseRateAmount: number
	allowsCod: boolean
	isActive: boolean
	sortOrder: number
	courierDefault: string | null
}

async function fetchZones(): Promise<Zone[]> {
	const res = await fetch("/admin/zonas/api", { cache: "no-store" })
	return res.json()
}

export default function ZonesPage() {
	const [zones, setZones] = useState<Zone[]>([])
	const [editing, setEditing] = useState<Zone | null>(null)
	const [showCreate, setShowCreate] = useState(false)
	const [pending, startTransition] = useTransition()

	useEffect(() => {
		fetchZones().then(setZones)
	}, [])

	function refresh() {
		fetchZones().then(setZones)
		setEditing(null)
		setShowCreate(false)
	}

	return (
		<>
			<PageHeader
				title="Zonas de envío"
				actions={
					<button
						type="button"
						onClick={() => setShowCreate(true)}
						className="rounded-lg bg-velajuy-wine px-3 py-2 text-sm font-medium text-white"
					>
						Nueva zona
					</button>
				}
			/>
			<ul className="space-y-2">
				{zones.map((z) => (
					<li key={z.id} className="rounded-2xl border border-velajuy-wine/10 bg-white p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium text-velajuy-wine">
									{z.name}{" "}
									{!z.isActive && <span className="text-xs text-zinc-500">(inactiva)</span>}
								</p>
								<p className="text-sm text-velajuy-wine-soft">
									{z.department}
									{z.cities ? ` · ${z.cities.join(", ")}` : " · (todo el depto)"} · Tarifa{" "}
									{(z.baseRateAmount / 100).toLocaleString("es-CO")} COP · COD{" "}
									{z.allowsCod ? "sí" : "no"}
								</p>
							</div>
							<div className="flex gap-2">
								<button
									onClick={() => setEditing(z)}
									className="rounded-lg border border-velajuy-wine/20 px-3 py-1 text-sm text-velajuy-wine"
								>
									Editar
								</button>
								<button
									onClick={() => {
										if (!confirm("¿Desactivar esta zona?")) return
										startTransition(async () => {
											await deactivateZone(z.id)
											toast.success("Zona desactivada")
											refresh()
										})
									}}
									disabled={pending}
									className="rounded-lg border border-red-700 px-3 py-1 text-sm text-red-700 disabled:opacity-60"
								>
									Desactivar
								</button>
							</div>
						</div>
						{editing?.id === z.id && (
							<div className="mt-4">
								<ZoneForm
									mode={{ kind: "edit", id: z.id }}
									defaults={{
										name: z.name,
										country: "CO",
										department: z.department,
										cities: z.cities,
										baseRatePesos: Math.round(z.baseRateAmount / 100),
										courierDefault: z.courierDefault,
										allowsCod: z.allowsCod,
										isActive: z.isActive,
										sortOrder: z.sortOrder,
									}}
									onSaved={refresh}
								/>
							</div>
						)}
					</li>
				))}
			</ul>
			{showCreate && (
				<div className="mt-6 rounded-2xl border border-velajuy-wine/10 bg-white p-4">
					<h2 className="mb-3 text-lg font-bold text-velajuy-wine">Nueva zona</h2>
					<ZoneForm
						mode={{ kind: "create" }}
						defaults={{
							name: "",
							country: "CO",
							department: "",
							cities: null,
							baseRatePesos: 10_000,
							courierDefault: null,
							allowsCod: false,
							isActive: true,
							sortOrder: 100,
						}}
						onSaved={refresh}
					/>
				</div>
			)}
		</>
	)
}
