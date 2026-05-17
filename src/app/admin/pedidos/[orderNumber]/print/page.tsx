import { notFound } from "next/navigation"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { addresses } from "@/lib/db/schema"
import { getOrderByNumber } from "@/lib/admin/orders/queries"
import { formatCOP } from "@/lib/money"

export default async function PackingSlipPage({
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
	const isCod = order.paymentMethod === "contraentrega"

	return (
		<main className="mx-auto max-w-2xl bg-white p-10 text-zinc-900 print:p-0">
			<h1 className="text-2xl font-bold">Pedido {order.orderNumber}</h1>
			{isCod && (
				<p className="mt-2 rounded border-2 border-black p-2 text-lg font-bold">
					COBRAR {formatCOP(Number(order.totalAmount))} AL CLIENTE
				</p>
			)}
			{shippingAddress && (
				<address className="mt-6 not-italic">
					<p>
						<b>{shippingAddress.recipientName}</b>
					</p>
					<p>{shippingAddress.phone}</p>
					<p>{shippingAddress.line1}</p>
					{shippingAddress.line2 && <p>{shippingAddress.line2}</p>}
					{shippingAddress.neighborhood && <p>{shippingAddress.neighborhood}</p>}
					<p>
						{shippingAddress.city}, {shippingAddress.department}
					</p>
				</address>
			)}
			<table className="mt-6 w-full text-sm">
				<thead>
					<tr>
						<th className="text-left">Artículo</th>
						<th className="text-right">Qty</th>
					</tr>
				</thead>
				<tbody>
					{order.items.map((item) => (
						<tr key={item.id} className="border-t">
							<td className="py-2">{item.nameSnapshot}</td>
							<td className="py-2 text-right">{item.quantity}</td>
						</tr>
					))}
				</tbody>
			</table>
		</main>
	)
}
