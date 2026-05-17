import { describe, it, expect, vi } from "vitest"

vi.mock("next/headers", () => ({ headers: async () => new Headers() }))
vi.mock("next/navigation", () => ({
	redirect: vi.fn((url: string) => {
		throw new Error(`redirect:${url}`)
	}),
}))

let session: { user: { role?: string } } | null = null
vi.mock("@/lib/auth", () => ({
	auth: { api: { getSession: async () => session } },
}))

import { requireOwner, getAdminRole } from "@/lib/auth-guards"

describe("requireOwner", () => {
	it("returns the session for owner role", async () => {
		session = { user: { role: "owner" } }
		const result = await requireOwner()
		expect(result.role).toBe("owner")
	})
	it("redirects when caller is staff", async () => {
		session = { user: { role: "staff" } }
		await expect(requireOwner()).rejects.toThrow(/redirect:\/admin\?error=forbidden/)
	})
	it("redirects when no session", async () => {
		session = null
		await expect(requireOwner()).rejects.toThrow(/redirect:\/admin\/ingresar/)
	})
})

describe("getAdminRole", () => {
	it("returns role string", async () => {
		session = { user: { role: "staff" } }
		expect(await getAdminRole()).toBe("staff")
	})
	it("returns null when no session", async () => {
		session = null
		expect(await getAdminRole()).toBeNull()
	})
})
