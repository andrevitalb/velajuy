export function orderShippedEmail(args: {
	orderNumber: string
	courier: string
	trackingNumber: string
}) {
	const subject = `Tu pedido va en camino · ${args.orderNumber}`
	const text = `¡Tu pedido ${args.orderNumber} salió! Courier: ${args.courier}. Tracking: ${args.trackingNumber}.`
	const html = `
		<div style="font-family: -apple-system; color: #5c1a2a;">
			<p>¡Tu pedido <b>${args.orderNumber}</b> ya va en camino!</p>
			<p>Courier: <b>${args.courier}</b></p>
			<p>Tracking: <b>${args.trackingNumber}</b></p>
		</div>
	`
	return { subject, html, text }
}
