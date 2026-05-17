"use server"

import { eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { orderItems, orders, products, stockMovements, users } from "@/lib/db/schema"
import { requireAdmin } from "@/lib/auth-guards"
import { sendEmail } from "@/lib/email/client"
import { sendAdminNotification } from "@/lib/email/notify"
import { getOwnerEmail } from "@/lib/admin/settings/queries"
import { orderShippedEmail } from "@/lib/email/templates/order-shipped"
import { orderDeliveredEmail } from "@/lib/email/templates/order-delivered"
import { adminPaymentReceivedEmail } from "@/lib/email/templates/admin-payment-received"
import { assertTransition, timestampsFor, type OrderStatus } from "./order-state"

async function loadOrder(orderId: string) {
	const [row] = await db.select().from(orders).where(eq(orders.id, orderId))
	if (!row) throw new Error("Order not found")
	return row
}

async function recipient(orderId: string): Promise<string | null> {
	const order = await loadOrder(orderId)
	if (order.userId) {
		const [u] = await db.select().from(users).where(eq(users.id, order.userId))
		return u?.email ?? order.guestEmail
	}
	return order.guestEmail
}

export async function markPreparing(orderId: string): Promise<void> {
	await requireAdmin()
	const order = await loadOrder(orderId)
	assertTransition(order.status as OrderStatus, "preparing")
	await db.update(orders).set({ status: "preparing" }).where(eq(orders.id, orderId))
	revalidatePath(`/admin/pedidos/${order.orderNumber}`)
}

const ShippedInput = z.object({
	courier: z.enum(["inter", "servientrega", "envia"]),
	trackingNumber: z.string().min(3).max(64),
})

export async function markShipped(
	orderId: string,
	input: z.infer<typeof ShippedInput>,
): Promise<void> {
	await requireAdmin()
	const parsed = ShippedInput.parse(input)
	const order = await loadOrder(orderId)
	assertTransition(order.status as OrderStatus, "shipped")
	const ts = timestampsFor("shipped")
	await db
		.update(orders)
		.set({
			status: "shipped",
			shippingCourier: parsed.courier,
			trackingNumber: parsed.trackingNumber,
			shippedAt: ts.shippedAt,
		})
		.where(eq(orders.id, orderId))
	const to = await recipient(orderId)
	if (to) {
		const tmpl = orderShippedEmail({
			orderNumber: order.orderNumber,
			courier: parsed.courier,
			trackingNumber: parsed.trackingNumber,
		})
		await sendEmail({ to, ...tmpl })
	}
	revalidatePath(`/admin/pedidos/${order.orderNumber}`)
}

export async function markDelivered(orderId: string): Promise<void> {
	await requireAdmin()
	const order = await loadOrder(orderId)
	assertTransition(order.status as OrderStatus, "delivered")
	const ts = timestampsFor("delivered")
	await db
		.update(orders)
		.set({ status: "delivered", deliveredAt: ts.deliveredAt })
		.where(eq(orders.id, orderId))
	const to = await recipient(orderId)
	if (to) {
		const tmpl = orderDeliveredEmail({ orderNumber: order.orderNumber })
		await sendEmail({ to, ...tmpl })
	}
	if (order.paymentMethod === "contraentrega" && order.paymentStatus === "pending_on_delivery") {
		const ownerEmail = await getOwnerEmail()
		await sendAdminNotification(
			"cod_ready",
			{
				subject: `COD listo para confirmar pago · ${order.orderNumber}`,
				html: `<p>Pedido entregado. Cuando recibas el efectivo, marca el pago.</p>`,
				text: `Pedido ${order.orderNumber} entregado. Confirma el pago COD.`,
			},
			{ ownerEmail },
		)
	}
	revalidatePath(`/admin/pedidos/${order.orderNumber}`)
}

export async function markCodPaid(orderId: string): Promise<void> {
	await requireAdmin()
	const order = await loadOrder(orderId)
	if (order.paymentMethod !== "contraentrega") {
		throw new Error("markCodPaid only applies to COD orders")
	}
	await db
		.update(orders)
		.set({ paymentStatus: "paid", paidAt: new Date() })
		.where(eq(orders.id, orderId))
	const ownerEmail = await getOwnerEmail()
	const tmpl = adminPaymentReceivedEmail({
		orderNumber: order.orderNumber,
		provider: "contraentrega",
		amount: Number(order.totalAmount),
	})
	await sendAdminNotification("payment_received", tmpl, { ownerEmail })
	revalidatePath(`/admin/pedidos/${order.orderNumber}`)
}

export async function cancelOrder(orderId: string, reason: string | null = null): Promise<void> {
	const session = await requireAdmin()
	const order = await loadOrder(orderId)
	assertTransition(order.status as OrderStatus, "cancelled")
	const stockWasDecremented =
		order.status === "paid" ||
		order.status === "preparing" ||
		(order.paymentMethod === "contraentrega" && order.status !== "pending_payment")

	await db.transaction(async (tx) => {
		await tx
			.update(orders)
			.set({ status: "cancelled", cancelledAt: new Date(), notes: reason ?? order.notes })
			.where(eq(orders.id, orderId))

		if (stockWasDecremented) {
			const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId))
			for (const item of items) {
				await tx.insert(stockMovements).values({
					productId: item.productId,
					delta: item.quantity,
					reason: "cancellation",
					orderId: order.id,
					staffId: session.user.id,
					notes: reason,
				})
				await tx
					.update(products)
					.set({ stockQuantity: sql`${products.stockQuantity} + ${item.quantity}` })
					.where(eq(products.id, item.productId))
			}
		}
	})

	revalidatePath(`/admin/pedidos/${order.orderNumber}`)
}
