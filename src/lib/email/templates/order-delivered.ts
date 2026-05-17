export function orderDeliveredEmail(args: { orderNumber: string }) {
	const subject = `Tu pedido fue entregado · ${args.orderNumber}`
	const text = `Tu pedido ${args.orderNumber} fue entregado. ¡Gracias por comprar en Velajuy!`
	const html = `<p style="font-family: -apple-system; color: #5c1a2a;">${text}</p>`
	return { subject, html, text }
}
