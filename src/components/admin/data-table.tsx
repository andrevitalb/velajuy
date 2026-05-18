import type { ReactNode } from "react"

export type Column<T> = {
	header: string
	headerCell?: ReactNode
	cell: (row: T) => ReactNode
	width?: string
	align?: "left" | "right" | "center"
}

export function DataTable<T>({
	columns,
	rows,
	rowKey,
	emptyLabel = "Sin resultados",
	caption,
}: {
	columns: Column<T>[]
	rows: T[]
	rowKey: (row: T) => string
	emptyLabel?: string
	caption?: string
}) {
	if (rows.length === 0) {
		return (
			<p className="rounded-xl bg-velajuy-cream p-8 text-center text-velajuy-wine-soft">
				{emptyLabel}
			</p>
		)
	}
	return (
		<div
			role="region"
			aria-label={caption}
			className="overflow-x-auto rounded-xl border border-velajuy-wine/10 bg-white"
		>
			<table className="w-full border-collapse">
				{caption && <caption className="sr-only">{caption}</caption>}
				<thead>
					<tr className="border-b border-velajuy-wine/10 text-left text-xs uppercase tracking-wide text-velajuy-wine-soft">
						{columns.map((c) =>
							c.headerCell ? (
								<th
									key={c.header}
									className={`px-4 py-3 ${c.align === "right" ? "text-right" : ""}`}
									style={c.width ? { width: c.width } : undefined}
									scope="col"
								>
									{c.headerCell}
								</th>
							) : (
								<th
									key={c.header}
									scope="col"
									className={`px-4 py-3 ${c.align === "right" ? "text-right" : ""}`}
									style={c.width ? { width: c.width } : undefined}
								>
									{c.header}
								</th>
							),
						)}
					</tr>
				</thead>
				<tbody className="divide-y divide-velajuy-wine/10">
					{rows.map((r) => (
						<tr key={rowKey(r)}>
							{columns.map((c) => (
								<td
									key={c.header}
									className={`px-4 py-3 align-middle text-sm text-velajuy-wine ${c.align === "right" ? "text-right tabular-nums" : ""}`}
								>
									{c.cell(r)}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}
