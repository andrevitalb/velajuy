"use client"

import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

export function SortableTh({
	field,
	label,
	className,
	align,
}: {
	field: string
	label: string
	className?: string
	align?: "left" | "right" | "center"
}) {
	const router = useRouter()
	const params = useSearchParams()
	const sort = params.get("sort")
	const dir = params.get("dir") ?? "asc"
	const active = sort === field

	function toggle() {
		const next = new URLSearchParams(params.toString())
		next.set("sort", field)
		next.set("dir", active && dir === "asc" ? "desc" : "asc")
		// Reset to page 1 whenever sort changes.
		next.delete("page")
		router.push(`?${next.toString()}`)
	}

	return (
		<th
			scope="col"
			className={`${align === "right" ? "text-right" : ""} ${className ?? ""}`}
			aria-sort={!active ? "none" : dir === "asc" ? "ascending" : "descending"}
		>
			<button
				type="button"
				onClick={toggle}
				className="inline-flex items-center gap-1 text-left font-medium text-velajuy-wine transition-all duration-150 hover:underline active:scale-95"
			>
				{label}
				{active ? (
					dir === "asc" ? (
						<ChevronUp className="size-3" aria-hidden="true" />
					) : (
						<ChevronDown className="size-3" aria-hidden="true" />
					)
				) : (
					<ChevronsUpDown className="size-3 opacity-50" aria-hidden="true" />
				)}
			</button>
		</th>
	)
}
