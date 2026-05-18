"use client"

import { useOptimistic, useState, useTransition } from "react"
import { toast } from "sonner"
import { adjustStock } from "@/lib/admin/inventory/actions"
import { Button } from "@/components/ui/button"

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
	const [optimisticStock, addOptimistic] = useOptimistic(
		current,
		(stock: number, change: number) => stock + change,
	)

	async function undo(applied: number) {
		try {
			await adjustStock({ productId, delta: -applied, reason: "adjustment", notes: "undo" })
			toast.success("Ajuste revertido")
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "No se pudo deshacer")
		}
	}

	function submit() {
		if (delta === 0) return
		const applied = delta
		const appliedNotes = notes || null
		const appliedReason = reason
		startTransition(async () => {
			addOptimistic(applied)
			try {
				await adjustStock({
					productId,
					delta: applied,
					reason: appliedReason,
					notes: appliedNotes,
				})
				toast.success(`Stock ajustado (${applied >= 0 ? "+" : ""}${applied})`, {
					action: {
						label: "Deshacer",
						onClick: () => {
							startTransition(() => {
								addOptimistic(-applied)
								void undo(applied)
							})
						},
					},
				})
				setDelta(0)
				setNotes("")
			} catch (err) {
				// Optimistic state is auto-reverted when the transition finishes
				// because React reconciles back to the server-driven `current`.
				toast.error(err instanceof Error ? err.message : "No se pudo aplicar el ajuste")
			}
		})
	}

	return (
		<tr className="border-t border-velajuy-wine/10">
			<td className="py-3 text-sm text-velajuy-wine">{name}</td>
			<td
				className={`py-3 text-sm font-medium ${optimisticStock <= threshold ? "text-red-700" : "text-velajuy-wine"}`}
				aria-live="polite"
			>
				{optimisticStock}
			</td>
			<td className="py-3">
				<input
					type="number"
					aria-label={`Delta de stock para ${name}`}
					value={delta}
					onChange={(e) => setDelta(parseInt(e.target.value, 10) || 0)}
					className="w-20 rounded-lg border border-velajuy-wine/20 px-2 py-1 text-sm"
				/>
			</td>
			<td className="py-3">
				<select
					aria-label={`Motivo del ajuste para ${name}`}
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
					aria-label={`Nota del ajuste para ${name}`}
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					placeholder="Nota (opcional)"
					className="w-full rounded-lg border border-velajuy-wine/20 px-2 py-1 text-sm"
				/>
			</td>
			<td className="py-3">
				<Button
					type="button"
					size="sm"
					onClick={submit}
					pending={pending}
					disabled={pending || delta === 0}
				>
					Aplicar
				</Button>
			</td>
		</tr>
	)
}
