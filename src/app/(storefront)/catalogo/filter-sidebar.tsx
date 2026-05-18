"use client"

import { SlidersHorizontal } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet } from "@/components/ui/sheet"
import {
	type CatalogFilters,
	filtersFromSearchParams,
	filtersToSearchString,
} from "@/lib/catalog/filters"
import type { AttributeFacet } from "@/lib/catalog/queries"

const ATTRIBUTE_KEYS = ["color", "largo", "estilo"] as const

type AttrKey = (typeof ATTRIBUTE_KEYS)[number]

function activeFilterCount(f: CatalogFilters): number {
	let n = 0
	for (const key of ATTRIBUTE_KEYS) n += f[key].length
	if (f.disponible) n += 1
	return n
}

function FiltersBody({
	facets,
	pending,
	toggle,
	setDisponible,
	apply,
	reset,
}: {
	facets: AttributeFacet[]
	pending: CatalogFilters
	toggle: (attr: AttrKey, slug: string) => void
	setDisponible: (v: boolean) => void
	apply: () => void
	reset: () => void
}) {
	const count = activeFilterCount(pending)
	return (
		<div className="space-y-6">
			{count > 0 && (
				<Badge tone="info" srLabel="Filtros activos">
					{count} filtros
				</Badge>
			)}

			{facets.map((facet) => {
				const attr = facet.slug as AttrKey
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
						onChange={(e) => setDisponible(e.target.checked)}
						className="accent-velajuy-wine"
					/>
					Solo disponibles
				</label>
			</section>

			<div className="flex gap-2">
				<Button variant="primary" size="md" className="flex-1" onClick={apply}>
					Aplicar
				</Button>
				<Button variant="secondary" size="md" onClick={reset}>
					Limpiar
				</Button>
			</div>
		</div>
	)
}

export function FilterSidebar({ facets }: { facets: AttributeFacet[] }) {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [open, setOpen] = useState(false)
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

	function toggle(attr: AttrKey, slug: string) {
		setPending((prev) => {
			const next = new Set(prev[attr])
			if (next.has(slug)) next.delete(slug)
			else next.add(slug)
			return { ...prev, [attr]: Array.from(next) }
		})
	}

	function setDisponible(v: boolean) {
		setPending((prev) => ({ ...prev, disponible: v }))
	}

	function apply() {
		const qs = filtersToSearchString(pending)
		router.push(qs ? `/catalogo?${qs}` : "/catalogo")
		setOpen(false)
	}

	function reset() {
		const cleared = { color: [], largo: [], estilo: [], disponible: false, sort: pending.sort }
		setPending(cleared)
		const qs = filtersToSearchString(cleared)
		router.push(qs ? `/catalogo?${qs}` : "/catalogo")
		setOpen(false)
	}

	const count = activeFilterCount(current)

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-velajuy-wine/30 px-4 text-sm font-medium text-velajuy-wine transition-all duration-150 active:scale-95 lg:hidden"
			>
				<SlidersHorizontal className="size-4" aria-hidden="true" />
				Filtrar
				{count > 0 && (
					<Badge tone="info" srLabel="Filtros activos" className="ml-1">
						{count}
					</Badge>
				)}
			</button>

			<Sheet open={open} onClose={() => setOpen(false)} title="Filtros">
				<FiltersBody
					facets={facets}
					pending={pending}
					toggle={toggle}
					setDisponible={setDisponible}
					apply={apply}
					reset={reset}
				/>
			</Sheet>

			<aside className="hidden lg:block">
				<FiltersBody
					facets={facets}
					pending={pending}
					toggle={toggle}
					setDisponible={setDisponible}
					apply={apply}
					reset={reset}
				/>
			</aside>
		</>
	)
}
