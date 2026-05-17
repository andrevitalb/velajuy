"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { markShipped } from "@/lib/admin/orders/actions"

export function ShippedForm({ orderId, onClose }: { orderId: string; onClose: () => void }) {
	const [courier, setCourier] = useState<"inter" | "servientrega" | "envia">("inter")
	const [tracking, setTracking] = useState("")
	const [pending, startTransition] = useTransition()

	function submit(e: React.FormEvent) {
		e.preventDefault()
		startTransition(async () => {
			try {
				await markShipped(orderId, { courier, trackingNumber: tracking })
				toast.success("Pedido marcado como enviado")
				onClose()
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Error al marcar enviado")
			}
		})
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
			<form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-6">
				<h2 className="mb-4 text-xl font-bold text-velajuy-wine">Marcar enviado</h2>
				<label className="block text-sm text-velajuy-wine">
					Courier
					<select
						value={courier}
						onChange={(e) => setCourier(e.target.value as typeof courier)}
						className="mt-1 w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"
					>
						<option value="inter">Inter Rapidísimo</option>
						<option value="servientrega">Servientrega</option>
						<option value="envia">Envía</option>
					</select>
				</label>
				<label className="mt-4 block text-sm text-velajuy-wine">
					Número de guía
					<input
						value={tracking}
						onChange={(e) => setTracking(e.target.value)}
						required
						minLength={3}
						className="mt-1 w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"
					/>
				</label>
				<div className="mt-6 flex justify-end gap-2">
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg px-3 py-2 text-sm text-velajuy-wine"
					>
						Cancelar
					</button>
					<button
						type="submit"
						disabled={pending}
						className="rounded-lg bg-velajuy-wine px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
					>
						{pending ? "Enviando…" : "Confirmar envío"}
					</button>
				</div>
			</form>
		</div>
	)
}
