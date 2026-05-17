"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import { filtersFromSearchParams, filtersToSearchString } from "@/lib/catalog/filters"
import type { AttributeFacet } from "@/lib/catalog/queries"

const ATTRIBUTE_KEYS = ["color", "largo", "estilo"] as const

export function FilterSidebar({ facets }: { facets: AttributeFacet[] }) {
	const router = useRouter()
	const searchParams = useSearchParams()
	const current = useMemo(() => {
		const raw: Record<string, string | string[]> = {}
		for (const key of ATTRIBUTE_KEYS) raw[key] = searchParams.getAll(key)
		const dispo = searchParams.get("disponible")
		if (dispo) raw.disponible = dispo
		const sort = searchParams.get("sort")
		if (sort) raw.sort = sort
		return filtersFromSearchParams(raw)
	}, [searchParams])

	// Reset pending state during render when the URL (current) changes externally.
	// This is the React-recommended pattern over a useEffect+setState.
	const [pending, setPending] = useState(current)
	const [lastCurrent, setLastCurrent] = useState(current)
	if (current !== lastCurrent) {
		setLastCurrent(current)
		setPending(current)
	}

	function toggle(attr: (typeof ATTRIBUTE_KEYS)[number], slug: string) {
		setPending((prev) => {
			const next = new Set(prev[attr])
			if (next.has(slug)) next.delete(slug)
			else next.add(slug)
			return { ...prev, [attr]: Array.from(next) }
		})
	}

	function apply() {
		const qs = filtersToSearchString(pending)
		router.push(qs ? `/catalogo?${qs}` : "/catalogo")
	}

	function reset() {
		const cleared = { color: [], largo: [], estilo: [], disponible: false, sort: pending.sort }
		setPending(cleared)
		const qs = filtersToSearchString(cleared)
		router.push(qs ? `/catalogo?${qs}` : "/catalogo")
	}

	return (
		<aside className="space-y-6">
			{facets.map((facet) => {
				const attr = facet.slug as (typeof ATTRIBUTE_KEYS)[number]
				if (!ATTRIBUTE_KEYS.includes(attr)) return null
				return (
					<section key={facet.slug}>
						<h3 className="mb-2 text-sm font-semibold text-velajuy-wine">{facet.name}</h3>
						<ul className="space-y-1">
							{facet.values.map((v) => (
								<li key={v.slug}>
									<label className="flex cursor-pointer items-center gap-2 text-sm text-velajuy-wine-soft">
										<input
											type="checkbox"
											checked={pending[attr].includes(v.slug)}
											onChange={() => toggle(attr, v.slug)}
											className="accent-velajuy-wine"
										/>
										<span>
											{v.name}{" "}
											<span className="text-xs text-velajuy-wine-soft/70">({v.count})</span>
										</span>
									</label>
								</li>
							))}
						</ul>
					</section>
				)
			})}

			<section>
				<label className="flex cursor-pointer items-center gap-2 text-sm text-velajuy-wine">
					<input
						type="checkbox"
						checked={pending.disponible}
						onChange={(e) => setPending((prev) => ({ ...prev, disponible: e.target.checked }))}
						className="accent-velajuy-wine"
					/>
					Solo disponibles
				</label>
			</section>

			<div className="flex gap-2">
				<button
					type="button"
					onClick={apply}
					className="flex-1 rounded-lg bg-velajuy-wine px-3 py-2 text-sm font-medium text-white"
				>
					Aplicar
				</button>
				<button
					type="button"
					onClick={reset}
					className="rounded-lg border border-velajuy-wine/30 px-3 py-2 text-sm text-velajuy-wine"
				>
					Limpiar
				</button>
			</div>
		</aside>
	)
}
