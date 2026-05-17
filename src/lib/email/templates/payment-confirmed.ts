import { formatCOP } from "@/lib/money"

export function paymentConfirmedEmail(args: { orderNumber: string; total: number }) {
	const subject = `Pago confirmado · ${args.orderNumber}`
	const text = `¡Recibimos tu pago de ${formatCOP(args.total)} para el pedido ${args.orderNumber}! Estamos preparando tu peluca.`
	const html = `<p style="font-family: -apple-system; color: #5c1a2a;">${text}</p>`
	return { subject, html, text }
}
