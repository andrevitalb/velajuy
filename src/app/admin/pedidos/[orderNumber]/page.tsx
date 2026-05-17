import Link from "next/link"
import type { Route } from "next"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { eq } from "drizzle-orm"
import { PageHeader } from "@/components/admin/page-header"
import { StatusPill } from "@/components/admin/status-pill"
import { formatCOP } from "@/lib/money"
import { getOrderByNumber } from "@/lib/admin/orders/queries"
import { db } from "@/lib/db"
import { addresses } from "@/lib/db/schema"
import { StatusActions } from "./status-actions"
import type { OrderStatus } from "@/lib/admin/orders/order-state"

export default async function OrderDetailPage({
	params,
}: {
	params: Promise<{ orderNumber: string }>
}) {
	const { orderNumber } = await params
	const order = await getOrderByNumber(orderNumber)
	if (!order) notFound()

	const shippingAddress = order.shippingAddressId
		? (await db.select().from(addresses).where(eq(addresses.id, order.shippingAddressId)))[0]
		: null

	const timeline = [
		{ label: "Pedido recibido", at: order.placedAt },
		{ label: "Pagado", at: order.paidAt },
		{ label: "Enviado", at: order.shippedAt },
		{ label: "Entregado", at: order.deliveredAt },
		{ label: "Cancelado", at: order.cancelledAt },
	].filter((t) => t.at)

	return (
		<>
			<PageHeader
				title={`Pedido ${order.orderNumber}`}
				subtitle={format(new Date(order.placedAt), "d 'de' MMMM yyyy · HH:mm", { locale: es })}
				actions={
					<Link
						href={`/admin/pedidos/${order.orderNumber}/print` as Route}
						className="rounded-lg border border-velajuy-wine/20 px-3 py-2 text-sm text-velajuy-wine"
					>
						Imprimir
					</Link>
				}
			/>

			<div className="mb-6 flex items-center gap-3">
				<StatusPill status={order.status} />
				<span className="text-sm text-velajuy-wine-soft">Pago: {order.paymentStatus}</span>
			</div>

			<StatusActions
				orderId={order.id}
				status={order.status as OrderStatus}
				paymentMethod={order.paymentMethod}
				paymentStatus={order.paymentStatus}
			/>

			<section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div className="rounded-2xl border border-velajuy-wine/10 bg-white p-5 lg:col-span-2">
					<h2 className="mb-3 text-lg font-bold text-velajuy-wine">Artículos</h2>
					<ul className="divide-y divide-velajuy-wine/10">
						{order.items.map((item) => (
							<li key={item.id} className="flex items-center justify-between py-3">
								<div>
									<p className="font-medium text-velajuy-wine">{item.nameSnapshot}</p>
									<p className="text-sm text-velajuy-wine-soft">
										{formatCOP(Number(item.unitPriceAmount))} × {item.quantity}
									</p>
								</div>
								<span className="font-medium text-velajuy-wine">
									{formatCOP(Number(item.lineTotalAmount))}
								</span>
							</li>
						))}
					</ul>
					<dl className="mt-4 space-y-1 text-sm text-velajuy-wine">
						<div className="flex justify-between">
							<dt>Subtotal</dt>
							<dd>{formatCOP(Number(order.subtotalAmount))}</dd>
						</div>
						<div className="flex justify-between">
							<dt>Envío</dt>
							<dd>{formatCOP(Number(order.shippingAmount))}</dd>
						</div>
						<div className="flex justify-between">
							<dt>IVA incluido</dt>
							<dd>{formatCOP(Number(order.taxAmount))}</dd>
						</div>
						<div className="flex justify-between font-bold">
							<dt>Total</dt>
							<dd>{formatCOP(Number(order.totalAmount))}</dd>
						</div>
					</dl>
				</div>
				<div className="space-y-6">
					<div className="rounded-2xl border border-velajuy-wine/10 bg-white p-5">
						<h2 className="mb-3 text-lg font-bold text-velajuy-wine">Cliente</h2>
						<p className="text-sm text-velajuy-wine">{order.guestEmail ?? "—"}</p>
						<p className="text-sm text-velajuy-wine">{order.guestPhone ?? "—"}</p>
					</div>
					<div className="rounded-2xl border border-velajuy-wine/10 bg-white p-5">
						<h2 className="mb-3 text-lg font-bold text-velajuy-wine">Envío</h2>
						{shippingAddress ? (
							<address className="not-italic text-sm text-velajuy-wine">
								{shippingAddress.recipientName}
								<br />
								{shippingAddress.line1}
								<br />
								{shippingAddress.line2 && (
									<>
										{shippingAddress.line2}
										<br />
									</>
								)}
								{shippingAddress.neighborhood && (
									<>
										{shippingAddress.neighborhood}
										<br />
									</>
								)}
								{shippingAddress.city}, {shippingAddress.department}
								<br />
								{shippingAddress.phone}
							</address>
						) : (
							<p className="text-sm text-velajuy-wine-soft">Sin dirección.</p>
						)}
						{order.trackingNumber && (
							<p className="mt-3 text-sm text-velajuy-wine">
								Guía: <b>{order.trackingNumber}</b> ({order.shippingCourier})
							</p>
						)}
					</div>
					<div className="rounded-2xl border border-velajuy-wine/10 bg-white p-5">
						<h2 className="mb-3 text-lg font-bold text-velajuy-wine">Línea de tiempo</h2>
						<ol className="space-y-2 text-sm text-velajuy-wine">
							{timeline.map((t) => (
								<li key={t.label}>
									<b>{t.label}</b>{" "}
									<span className="text-velajuy-wine-soft">
										{t.at && format(new Date(t.at), "d MMM HH:mm", { locale: es })}
									</span>
								</li>
							))}
						</ol>
					</div>
				</div>
			</section>
		</>
	)
}
