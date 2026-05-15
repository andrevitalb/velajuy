import { describe, expect, it } from "vitest"
import { filtersFromSearchParams, filtersToSearchString } from "@/lib/catalog/filters"

describe("filters", () => {
	it("parses empty params to empty filters", () => {
		expect(filtersFromSearchParams({})).toEqual({
			color: [],
			largo: [],
			estilo: [],
			disponible: false,
			sort: "nuevas",
		})
	})

	it("parses multi-value attribute params", () => {
		const f = filtersFromSearchParams({ color: ["rosa-pastel", "lila"] })
		expect(f.color).toEqual(["rosa-pastel", "lila"])
	})

	it("normalizes a single string into a one-element array", () => {
		const f = filtersFromSearchParams({ color: "rosa-pastel" })
		expect(f.color).toEqual(["rosa-pastel"])
	})

	it("parses disponible=1 as true", () => {
		expect(filtersFromSearchParams({ disponible: "1" }).disponible).toBe(true)
	})

	it("falls back to nuevas for unknown sort", () => {
		expect(filtersFromSearchParams({ sort: "wat" }).sort).toBe("nuevas")
	})

	it("serializes back to a query string", () => {
		const qs = filtersToSearchString({
			color: ["rosa-pastel", "lila"],
			largo: [],
			estilo: ["bob"],
			disponible: true,
			sort: "precio-asc",
		})
		expect(qs).toBe("color=rosa-pastel&color=lila&estilo=bob&disponible=1&sort=precio-asc")
	})

	it("omits defaults when serializing", () => {
		const qs = filtersToSearchString({
			color: [],
			largo: [],
			estilo: [],
			disponible: false,
			sort: "nuevas",
		})
		expect(qs).toBe("")
	})
})
