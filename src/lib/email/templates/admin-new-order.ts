import { formatCOP } from "@/lib/money"

export function adminNewOrderEmail(args: {
	orderNumber: string
	customer: string
	paymentMethod: string
	totalAmount: number
	itemCount: number
}) {
	const subject = `Nuevo pedido ${args.orderNumber} — ${formatCOP(args.totalAmount)}`
	const text = `Pedido ${args.orderNumber}\nCliente: ${args.customer}\nMétodo: ${args.paymentMethod}\nArtículos: ${args.itemCount}\nTotal: ${formatCOP(args.totalAmount)}`
	const html = `
		<div style="font-family: -apple-system, system-ui, sans-serif; color: #5c1a2a;">
			<h2 style="margin: 0 0 8px;">Pedido ${args.orderNumber}</h2>
			<p style="margin: 0 0 4px;">Cliente: <b>${args.customer}</b></p>
			<p style="margin: 0 0 4px;">Método: ${args.paymentMethod}</p>
			<p style="margin: 0 0 4px;">Artículos: ${args.itemCount}</p>
			<p style="margin: 0 0 4px;">Total: <b>${formatCOP(args.totalAmount)}</b></p>
		</div>
	`
	return { subject, html, text }
}
