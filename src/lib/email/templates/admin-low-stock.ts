export function adminLowStockEmail(args: { productName: string; quantity: number }) {
	const subject = `Stock bajo: ${args.productName} (${args.quantity})`
	const text = `Quedan ${args.quantity} unidades de ${args.productName}.`
	const html = `<p style="font-family: -apple-system; color: #5c1a2a;">${text}</p>`
	return { subject, html, text }
}
