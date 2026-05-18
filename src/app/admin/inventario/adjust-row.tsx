"use client"

import { useOptimistic, useState, useTransition } from "react"
import { toast } from "sonner"
import { adjustStock } from "@/lib/admin/inventory/actions"
import { Button } from "@/components/ui/button"

const REASONS = ["restock", "adjustment", "return"] as const
type Reason = (typeof REASONS)[number]

function isReason(v: string): v is Reason {
	return (REASONS as readonly string[]).includes(v)
}

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
	// Keep the raw string so the user can type a leading "-" mid-entry.
	// Parsing happens at submit time.
	const [deltaInput, setDeltaInput] = useState("0")
	const [reason, setReason] = useState<Reason>("restock")
	const [notes, setNotes] = useState("")
	const [pending, startTransition] = useTransition()
	const [optimisticStock, addOptimistic] = useOptimistic(
		current,
		(stock: number, change: number) => stock + change,
	)

	function parseDelta(): number {
		const n = Number.parseInt(deltaInput, 10)
		return Number.isNaN(n) ? 0 : n
	}

	function submit() {
		const applied = parseDelta()
		if (applied === 0) return
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
							// Revert via a fresh transition. We optimistically subtract the
							// applied delta, then call the server. On failure we re-apply
							// the optimistic delta so the UI matches the actual server state.
							startTransition(async () => {
								addOptimistic(-applied)
								try {
									await adjustStock({
										productId,
										delta: -applied,
										reason: "adjustment",
										notes: "undo",
									})
									toast.success("Ajuste revertido")
								} catch (err) {
									addOptimistic(applied)
									toast.error(err instanceof Error ? err.message : "No se pudo deshacer")
								}
							})
						},
					},
				})
				setDeltaInput("0")
				setNotes("")
			} catch (err) {
				// Revert the optimistic delta explicitly. We can't rely on a server
				// revalidatePath because the action threw before completing.
				addOptimistic(-applied)
				toast.error(err instanceof Error ? err.message : "No se pudo aplicar el ajuste")
			}
		})
	}

	return (
		<tr>
			<td className="px-4 py-2 text-sm text-velajuy-wine">{name}</td>
			<td
				className={`px-4 py-2 text-right text-sm font-medium tabular-nums ${optimisticStock <= threshold ? "text-red-700" : "text-velajuy-wine"}`}
				aria-live="polite"
			>
				{optimisticStock}
			</td>
			<td className="px-4 py-2">
				<input
					type="text"
					inputMode="numeric"
					pattern="-?[0-9]*"
					aria-label={`Delta de stock para ${name}`}
					value={deltaInput}
					onChange={(e) => setDeltaInput(e.target.value)}
					className="w-20 rounded-lg border border-velajuy-wine/20 px-2 py-1 text-sm tabular-nums"
				/>
			</td>
			<td className="px-4 py-2">
				<select
					aria-label={`Motivo del ajuste para ${name}`}
					value={reason}
					onChange={(e) => {
						const v = e.target.value
						if (isReason(v)) setReason(v)
					}}
					className="w-full rounded-lg border border-velajuy-wine/20 px-2 py-1 text-sm"
				>
					<option value="restock">Reposición</option>
					<option value="adjustment">Ajuste</option>
					<option value="return">Devolución</option>
				</select>
			</td>
			<td className="px-4 py-2">
				<input
					aria-label={`Nota del ajuste para ${name}`}
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					placeholder="Nota (opcional)"
					className="w-full rounded-lg border border-velajuy-wine/20 px-2 py-1 text-sm"
				/>
			</td>
			<td className="px-4 py-2 text-right">
				<Button
					type="button"
					size="sm"
					onClick={submit}
					pending={pending}
					disabled={pending || parseDelta() === 0}
				>
					Aplicar
				</Button>
			</td>
		</tr>
	)
}
