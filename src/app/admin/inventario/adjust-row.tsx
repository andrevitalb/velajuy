"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { adjustStock } from "@/lib/admin/inventory/actions"

export function AdjustRow({
	productId,
	name,
	current,
	threshold,
}: {
	productId: string
	name: string
	current: number
	threshold: number
}) {
	const [delta, setDelta] = useState(0)
	const [reason, setReason] = useState<"adjustment" | "restock" | "return">("restock")
	const [notes, setNotes] = useState("")
	const [pending, startTransition] = useTransition()

	function submit() {
		if (delta === 0) return
		startTransition(async () => {
			try {
				await adjustStock({ productId, delta, reason, notes: notes || null })
				toast.success("Stock actualizado")
				setDelta(0)
				setNotes("")
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Error")
			}
		})
	}

	return (
		<tr className="border-t border-velajuy-wine/10">
			<td className="py-3 text-sm text-velajuy-wine">{name}</td>
			<td
				className={`py-3 text-sm font-medium ${current <= threshold ? "text-red-700" : "text-velajuy-wine"}`}
			>
				{current}
			</td>
			<td className="py-3">
				<input
					type="number"
					value={delta}
					onChange={(e) => setDelta(parseInt(e.target.value, 10) || 0)}
					className="w-20 rounded-lg border border-velajuy-wine/20 px-2 py-1 text-sm"
				/>
			</td>
			<td className="py-3">
				<select
					value={reason}
					onChange={(e) => setReason(e.target.value as typeof reason)}
					className="rounded-lg border border-velajuy-wine/20 px-2 py-1 text-sm"
				>
					<option value="restock">Reposición</option>
					<option value="adjustment">Ajuste</option>
					<option value="return">Devolución</option>
				</select>
			</td>
			<td className="py-3">
				<input
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					placeholder="Nota (opcional)"
					className="w-full rounded-lg border border-velajuy-wine/20 px-2 py-1 text-sm"
				/>
			</td>
			<td className="py-3">
				<button
					type="button"
					onClick={submit}
					disabled={pending || delta === 0}
					className="rounded-lg bg-velajuy-wine px-3 py-1 text-sm font-medium text-white disabled:opacity-60"
				>
					Aplicar
				</button>
			</td>
		</tr>
	)
}
