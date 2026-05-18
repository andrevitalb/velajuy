"use client"

import { useRouter, useSearchParams } from "next/navigation"

export function Pagination({ total, perPage }: { total: number; perPage: number }) {
	const params = useSearchParams()
	const router = useRouter()
	const lastPage = Math.max(1, Math.ceil(total / perPage))
	const rawPage = Number(params.get("page") ?? 1) || 1
	const page = Math.min(lastPage, Math.max(1, rawPage))
	if (lastPage <= 1) return null

	function goTo(p: number) {
		const next = new URLSearchParams(params.toString())
		next.set("page", String(p))
		router.push(`?${next.toString()}`)
	}

	const from = (page - 1) * perPage + 1
	const to = Math.min(page * perPage, total)

	return (
		<nav aria-label="Paginación" className="mt-4 flex items-center justify-between text-sm">
			<p className="text-velajuy-wine-soft">
				Mostrando {from}–{to} de {total}
			</p>
			<div className="flex gap-2">
				{page > 1 && (
					<button
						type="button"
						onClick={() => goTo(page - 1)}
						className="rounded-md border border-velajuy-wine/20 px-3 py-1.5 transition-all duration-150 hover:bg-velajuy-pink-soft active:scale-95"
					>
						Anterior
					</button>
				)}
				{page < lastPage && (
					<button
						type="button"
						onClick={() => goTo(page + 1)}
						className="rounded-md border border-velajuy-wine/20 px-3 py-1.5 transition-all duration-150 hover:bg-velajuy-pink-soft active:scale-95"
					>
						Siguiente
					</button>
				)}
			</div>
		</nav>
	)
}
