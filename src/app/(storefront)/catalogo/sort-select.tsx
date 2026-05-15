"use client"

import { useRouter, useSearchParams } from "next/navigation"
import type { Sort } from "@/lib/catalog/filters"

const OPTIONS: Array<{ value: Sort; label: string }> = [
	{ value: "nuevas", label: "Nuevas" },
	{ value: "precio-asc", label: "Precio: menor a mayor" },
	{ value: "precio-desc", label: "Precio: mayor a menor" },
]

export function SortSelect({ current }: { current: Sort }) {
	const router = useRouter()
	const params = useSearchParams()

	function onChange(value: Sort) {
		const next = new URLSearchParams(params)
		if (value === "nuevas") next.delete("sort")
		else next.set("sort", value)
		const qs = next.toString()
		router.push(qs ? `/catalogo?${qs}` : "/catalogo")
	}

	return (
		<label className="flex items-center gap-2 text-sm text-velajuy-wine">
			<span>Ordenar:</span>
			<select
				value={current}
				onChange={(e) => onChange(e.target.value as Sort)}
				className="rounded-lg border border-velajuy-wine/20 bg-white px-3 py-1.5 text-sm text-velajuy-wine"
			>
				{OPTIONS.map((opt) => (
					<option key={opt.value} value={opt.value}>
						{opt.label}
					</option>
				))}
			</select>
		</label>
	)
}
