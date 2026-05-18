"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { cancelOrder, markCodPaid, markDelivered, markPreparing } from "@/lib/admin/orders/actions"
import { nextStatus, type OrderStatus } from "@/lib/admin/orders/order-state"
import { Button } from "@/components/ui/button"
import { ShippedForm } from "./shipped-form"

export function StatusActions({
	orderId,
	status,
	paymentMethod,
	paymentStatus,
}: {
	orderId: string
	status: OrderStatus
	paymentMethod: string | null
	paymentStatus: string
}) {
	const [pending, startTransition] = useTransition()
	const [showShipForm, setShowShipForm] = useState(false)
	const forward = nextStatus(status)
	const canCancel = status === "paid" || status === "preparing" || status === "pending_payment"
	const codNeedsPaid =
		paymentMethod === "contraentrega" && paymentStatus !== "paid" && status !== "cancelled"

	function run(label: string, fn: () => Promise<void>) {
		startTransition(async () => {
			try {
				await fn()
				toast.success(label)
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Error")
			}
		})
	}

	return (
		<div className="flex flex-wrap gap-2">
			{forward === "preparing" && (
				<Button
					type="button"
					size="sm"
					pending={pending}
					onClick={() => run("Marcado como preparando", () => markPreparing(orderId))}
				>
					Marcar preparando
				</Button>
			)}
			{forward === "shipped" && (
				<Button type="button" size="sm" disabled={pending} onClick={() => setShowShipForm(true)}>
					Marcar enviado
				</Button>
			)}
			{forward === "delivered" && (
				<Button
					type="button"
					size="sm"
					pending={pending}
					onClick={() => run("Marcado como entregado", () => markDelivered(orderId))}
				>
					Marcar entregado
				</Button>
			)}
			{codNeedsPaid && (
				<button
					type="button"
					disabled={pending}
					onClick={() => run("Pago COD confirmado", () => markCodPaid(orderId))}
					className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white transition-all duration-150 active:scale-95 active:opacity-90 disabled:opacity-60"
				>
					Marcar pago recibido (COD)
				</button>
			)}
			{canCancel && (
				<Button
					type="button"
					variant="danger"
					size="sm"
					pending={pending}
					onClick={() => {
						if (!confirm("¿Cancelar este pedido?")) return
						run("Pedido cancelado", () => cancelOrder(orderId, null))
					}}
				>
					Cancelar pedido
				</Button>
			)}
			{showShipForm && <ShippedForm orderId={orderId} onClose={() => setShowShipForm(false)} />}
		</div>
	)
}
