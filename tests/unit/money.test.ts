import { describe, expect, it } from "vitest"
import { formatCOP, fromMinor, toMinor } from "@/lib/money"

describe("money", () => {
	it("toMinor converts pesos to minor units", () => {
		expect(toMinor(50_000)).toBe(5_000_000)
		expect(toMinor(0)).toBe(0)
	})

	it("fromMinor converts minor units back to pesos", () => {
		expect(fromMinor(5_000_000)).toBe(50_000)
	})

	it("formatCOP renders Colombian peso", () => {
		expect(formatCOP(5_000_000)).toBe("$ 50.000")
		expect(formatCOP(0)).toBe("$ 0")
	})

	it("toMinor refuses non-integer pesos", () => {
		expect(() => toMinor(50_000.5)).toThrow()
	})
})
