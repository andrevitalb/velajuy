"use client"

import type { Route } from "next"
import { useRouter, useSearchParams } from "next/navigation"

const STATUS_OPTIONS = [
	{ value: "", label: "Todos" },
	{ value: "pending_payment", label: "Pago pendiente" },
	{ value: "paid", label: "Pagado" },
	{ value: "preparing", label: "Preparando" },
	{ value: "shipped", label: "Enviado" },
	{ value: "delivered", label: "Entregado" },
	{ value: "cancelled", label: "Cancelado" },
	{ value: "failed", label: "Falló" },
]

export function OrderFilters() {
	const router = useRouter()
	const search = useSearchParams()

	function setParam(key: string, value: string) {
		const next = new URLSearchParams(search.toString())
		if (value) next.set(key, value)
		else next.delete(key)
		router.push(`/admin/pedidos?${next.toString()}` as Route)
	}

	return (
		<div className="mb-6 flex flex-wrap gap-3">
			<select
				value={search.get("status") ?? ""}
				onChange={(e) => setParam("status", e.target.value)}
				className="rounded-lg border border-velajuy-wine/20 bg-white px-3 py-2 text-sm"
			>
				{STATUS_OPTIONS.map((o) => (
					<option key={o.value} value={o.value}>
						{o.label}
					</option>
				))}
			</select>
			<label className="flex items-center gap-2 text-sm text-velajuy-wine">
				<input
					type="checkbox"
					checked={search.get("cod") === "1"}
					onChange={(e) => setParam("cod", e.target.checked ? "1" : "")}
				/>
				Solo contra entrega
			</label>
		</div>
	)
}
