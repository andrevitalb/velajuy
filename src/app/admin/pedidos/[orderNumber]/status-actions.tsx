"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { cancelOrder, markCodPaid, markDelivered, markPreparing } from "@/lib/admin/orders/actions"
import { nextStatus, type OrderStatus } from "@/lib/admin/orders/order-state"
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
				<button
					type="button"
					disabled={pending}
					onClick={() => run("Marcado como preparando", () => markPreparing(orderId))}
					className="rounded-lg bg-velajuy-wine px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
				>
					Marcar preparando
				</button>
			)}
			{forward === "shipped" && (
				<button
					type="button"
					disabled={pending}
					onClick={() => setShowShipForm(true)}
					className="rounded-lg bg-velajuy-wine px-3 py-2 text-sm font-medium text-white"
				>
					Marcar enviado
				</button>
			)}
			{forward === "delivered" && (
				<button
					type="button"
					disabled={pending}
					onClick={() => run("Marcado como entregado", () => markDelivered(orderId))}
					className="rounded-lg bg-velajuy-wine px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
				>
					Marcar entregado
				</button>
			)}
			{codNeedsPaid && (
				<button
					type="button"
					disabled={pending}
					onClick={() => run("Pago COD confirmado", () => markCodPaid(orderId))}
					className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
				>
					Marcar pago recibido (COD)
				</button>
			)}
			{canCancel && (
				<button
					type="button"
					disabled={pending}
					onClick={() => {
						if (!confirm("¿Cancelar este pedido?")) return
						run("Pedido cancelado", () => cancelOrder(orderId, null))
					}}
					className="rounded-lg border border-red-700 px-3 py-2 text-sm font-medium text-red-700 disabled:opacity-60"
				>
					Cancelar pedido
				</button>
			)}
			{showShipForm && <ShippedForm orderId={orderId} onClose={() => setShowShipForm(false)} />}
		</div>
	)
}
