import { describe, expect, it } from "vitest"
import { safeRedirect } from "@/lib/safe-redirect"

describe("safeRedirect", () => {
	it("falls back when redirect is null", () => {
		expect(safeRedirect(null, "/cuenta")).toBe("/cuenta")
	})

	it("falls back when redirect is undefined", () => {
		expect(safeRedirect(undefined, "/cuenta")).toBe("/cuenta")
	})

	it("falls back when redirect is empty string", () => {
		expect(safeRedirect("", "/cuenta")).toBe("/cuenta")
	})

	it("returns safe same-origin path", () => {
		expect(safeRedirect("/cuenta/wishlist", "/cuenta")).toBe("/cuenta/wishlist")
	})

	it("rejects protocol-relative URLs", () => {
		expect(safeRedirect("//evil.com", "/cuenta")).toBe("/cuenta")
	})

	it("rejects https URLs", () => {
		expect(safeRedirect("https://evil.com", "/cuenta")).toBe("/cuenta")
	})

	it("rejects http URLs", () => {
		expect(safeRedirect("http://evil.com", "/cuenta")).toBe("/cuenta")
	})

	it("rejects backslash-prefixed paths", () => {
		expect(safeRedirect("\\evil.com", "/cuenta")).toBe("/cuenta")
	})

	it("rejects slash-backslash-prefixed paths", () => {
		expect(safeRedirect("/\\evil.com", "/cuenta")).toBe("/cuenta")
	})

	it("rejects paths containing backslashes", () => {
		expect(safeRedirect("/path\\evil", "/cuenta")).toBe("/cuenta")
	})

	it("rejects javascript: URLs", () => {
		expect(safeRedirect("javascript:alert(1)", "/cuenta")).toBe("/cuenta")
	})

	it("preserves query string and fragment", () => {
		expect(safeRedirect("/path?query=1#frag", "/cuenta")).toBe("/path?query=1#frag")
	})
})
