const COP = new Intl.NumberFormat("es-CO", {
	style: "currency",
	currency: "COP",
	maximumFractionDigits: 0,
})

export function toMinor(pesos: number): number {
	if (!Number.isInteger(pesos)) {
		throw new Error(`toMinor expects integer pesos, got ${pesos}`)
	}
	return pesos * 100
}

export function fromMinor(minor: number): number {
	return Math.round(minor / 100)
}

export function formatCOP(minor: number): string {
	return COP.format(fromMinor(minor))
}
