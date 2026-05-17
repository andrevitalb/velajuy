export function adminCodReadyEmail(args: { orderNumber: string; recipient: string }) {
	const subject = `Contra entrega listo para confirmar pago · ${args.orderNumber}`
	const text = `${args.orderNumber} entregado a ${args.recipient}. Cuando recibas el efectivo del courier, marca el pago como recibido en el admin.`
	const html = `<p style="font-family: -apple-system; color: #5c1a2a;">${text}</p>`
	return { subject, html, text }
}
