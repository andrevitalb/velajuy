import { formatCOP } from "@/lib/money"

export function adminPaymentReceivedEmail(args: {
	orderNumber: string
	provider: string
	amount: number
}) {
	const subject = `Pago confirmado · ${args.orderNumber}`
	const text = `Pago confirmado para ${args.orderNumber} vía ${args.provider}: ${formatCOP(args.amount)}.`
	const html = `<p style="font-family: -apple-system; color: #5c1a2a;">${text}</p>`
	return { subject, html, text }
}
