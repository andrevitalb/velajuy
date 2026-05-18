"use client"

import Link from "next/link"
import type { Route } from "next"
import { useId } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"

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

const FILTER_KEYS = ["status", "cod"] as const

export function OrderFilters() {
	const router = useRouter()
	const search = useSearchParams()
	const statusId = useId()

	function setParam(key: string, value: string) {
		const next = new URLSearchParams(search.toString())
		if (value) next.set(key, value)
		else next.delete(key)
		// Reset to page 1 whenever a filter changes.
		next.delete("page")
		router.push(`/admin/pedidos?${next.toString()}` as Route)
	}

	const activeCount = FILTER_KEYS.reduce(
		(acc, key) => acc + (search.get(key) ? 1 : 0),
		0,
	)

	return (
		<div className="mb-6 flex flex-wrap items-center gap-3">
			<label htmlFor={statusId} className="sr-only">
				Estado del pedido
			</label>
			<select
				id={statusId}
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
			{activeCount > 0 && (
				<>
					<Badge tone="info">
						{activeCount} {activeCount === 1 ? "filtro" : "filtros"}
					</Badge>
					<Link
						href={"/admin/pedidos" as Route}
						className="text-sm text-velajuy-wine underline transition-all duration-150 hover:text-velajuy-wine-soft active:scale-95"
					>
						Limpiar
					</Link>
				</>
			)}
		</div>
	)
}
