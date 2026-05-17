import { describe, expect, it } from "vitest"
import { slugify } from "@/lib/slug"

describe("slugify", () => {
	it("lowercases", () => {
		expect(slugify("Rosa")).toBe("rosa")
	})

	it("strips accents", () => {
		expect(slugify("Café Rosé")).toBe("cafe-rose")
	})

	it("replaces spaces and punctuation with single hyphens", () => {
		expect(slugify("Rosa pastel — 50 cm!")).toBe("rosa-pastel-50-cm")
	})

	it("trims leading/trailing hyphens", () => {
		expect(slugify("  ---hola--- ")).toBe("hola")
	})

	it("preserves digits", () => {
		expect(slugify("Largo 50cm")).toBe("largo-50cm")
	})
})
