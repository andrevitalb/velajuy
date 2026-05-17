import { contrastRatio } from "@/lib/a11y/contrast"
import { describe, expect, it } from "vitest"

describe("contrastRatio (WCAG 2.1)", () => {
	it("returns 21 for black on white", () => {
		expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1)
	})
	it("velajuy-wine on velajuy-cream meets AA", () => {
		expect(contrastRatio("#5c1a2a", "#fffaf5")).toBeGreaterThanOrEqual(4.5)
	})
	it("velajuy-wine-soft on velajuy-pink-soft passes AA", () => {
		// Token #7a3d4d is the locked-in value (ratio ≈ 6.63 ≥ 4.5)
		expect(contrastRatio("#7a3d4d", "#fde2ea")).toBeGreaterThanOrEqual(4.5)
	})
})
