import { describe, expect, it } from "vitest"

describe("env", () => {
	it("rejects missing DATABASE_URL", async () => {
		const orig = process.env.DATABASE_URL
		delete process.env.DATABASE_URL
		await expect(import("@/lib/env")).rejects.toThrow(/DATABASE_URL/)
		process.env.DATABASE_URL = orig
	})
})
