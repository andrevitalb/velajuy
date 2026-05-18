"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { markShipped } from "@/lib/admin/orders/actions"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"

const COURIERS = ["inter", "servientrega", "envia"] as const
type Courier = (typeof COURIERS)[number]

function isCourier(v: string): v is Courier {
	return (COURIERS as readonly string[]).includes(v)
}

export function ShippedForm({ orderId, onClose }: { orderId: string; onClose: () => void }) {
	const [courier, setCourier] = useState<Courier>("inter")
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
		<Modal label="Marcar enviado" onClose={onClose}>
			<form onSubmit={submit}>
				<h2 className="mb-4 text-xl font-bold text-velajuy-wine">Marcar enviado</h2>
				<label className="block text-sm text-velajuy-wine">
					Courier
					<select
						value={courier}
						onChange={(e) => {
							const v = e.target.value
							if (isCourier(v)) setCourier(v)
						}}
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
					<Button type="button" variant="ghost" size="sm" onClick={onClose}>
						Cancelar
					</Button>
					<Button type="submit" size="sm" pending={pending}>
						{pending ? "Enviando…" : "Confirmar envío"}
					</Button>
				</div>
			</form>
		</Modal>
	)
}
