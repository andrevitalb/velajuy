function srgbChannel(c: number) {
	const v = c / 255
	return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

function relLum(hex: string) {
	const h = hex.replace("#", "")
	const r = parseInt(h.slice(0, 2), 16)
	const g = parseInt(h.slice(2, 4), 16)
	const b = parseInt(h.slice(4, 6), 16)
	return 0.2126 * srgbChannel(r) + 0.7152 * srgbChannel(g) + 0.0722 * srgbChannel(b)
}

export function contrastRatio(fg: string, bg: string) {
	const L1 = relLum(fg)
	const L2 = relLum(bg)
	const [light, dark] = L1 > L2 ? [L1, L2] : [L2, L1]
	return (light + 0.05) / (dark + 0.05)
}
