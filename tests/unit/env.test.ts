import { beforeEach, describe, expect, it, vi } from "vitest"

describe("env", () => {
	beforeEach(() => {
		vi.resetModules()
	})

	it("rejects missing DATABASE_URL", async () => {
		const orig = process.env.DATABASE_URL
		delete process.env.DATABASE_URL
		try {
			await expect(import("@/lib/env")).rejects.toThrow(/DATABASE_URL/)
		} finally {
			process.env.DATABASE_URL = orig
		}
	})

	it("rejects BETTER_AUTH_SECRET shorter than 32 characters", async () => {
		const orig = process.env.BETTER_AUTH_SECRET
		process.env.BETTER_AUTH_SECRET = "too-short"
		try {
			await expect(import("@/lib/env")).rejects.toThrow(/BETTER_AUTH_SECRET/)
		} finally {
			process.env.BETTER_AUTH_SECRET = orig
		}
	})

	it("rejects malformed DATABASE_URL", async () => {
		const orig = process.env.DATABASE_URL
		process.env.DATABASE_URL = "not-a-url"
		try {
			await expect(import("@/lib/env")).rejects.toThrow(/DATABASE_URL/)
		} finally {
			process.env.DATABASE_URL = orig
		}
	})

	it("parses a valid env into the expected shape", async () => {
		const { env } = await import("@/lib/env")
		expect(env.DATABASE_URL).toMatch(/^postgres:\/\//)
		expect(env.BETTER_AUTH_SECRET.length).toBeGreaterThanOrEqual(32)
		expect(env.BETTER_AUTH_URL).toMatch(/^https?:\/\//)
		expect(env.NEXT_PUBLIC_APP_URL).toMatch(/^https?:\/\//)
		expect(env.NODE_ENV).toBeDefined()
	})
})
