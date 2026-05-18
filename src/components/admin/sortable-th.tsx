"use client"

import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

export function SortableTh({
	field,
	label,
	className,
	align,
	defaultDir = "desc",
}: {
	field: string
	label: string
	className?: string
	align?: "left" | "right" | "center"
	/**
	 * Default sort direction when no `dir` URL param is present. Must match the
	 * server's default (admin pages use "desc"). Override per-column if needed.
	 */
	defaultDir?: "asc" | "desc"
}) {
	const router = useRouter()
	const params = useSearchParams()
	const sort = params.get("sort")
	const dirParam = params.get("dir")
	const dir: "asc" | "desc" = dirParam === "asc" ? "asc" : dirParam === "desc" ? "desc" : defaultDir
	const active = sort === field

	function toggle() {
		const next = new URLSearchParams(params.toString())
		next.set("sort", field)
		// If the column isn't active yet, first click lands on "asc" (most
		// common UX expectation). If it's already active and ascending, flip to
		// "desc"; otherwise (active and "desc"), flip back to "asc".
		const nextDir = active && dir === "asc" ? "desc" : "asc"
		next.set("dir", nextDir)
		// Reset to page 1 whenever sort changes.
		next.delete("page")
		router.push(`?${next.toString()}`)
	}

	return (
		<th
			scope="col"
			className={`px-4 py-3 ${align === "right" ? "text-right" : ""} ${className ?? ""}`}
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
