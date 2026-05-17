import { describe, it, expect, vi } from "vitest"

const { requireAdminMock, transaction, sendAdminNotificationMock } = vi.hoisted(() => {
	const tx = {
		select: () => ({
			from: () => ({
				where: () => Promise.resolve([{ stockQuantity: 5, lowStockThreshold: 2, name: "X" }]),
			}),
		}),
		update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
		insert: () => ({ values: () => Promise.resolve() }),
	}
	return {
		requireAdminMock: vi.fn(async () => ({ user: { id: "staff-1" } })),
		transaction: vi.fn(async (cb: (t: typeof tx) => Promise<void>) => cb(tx)),
		sendAdminNotificationMock: vi.fn(),
	}
})

vi.mock("@/lib/auth-guards", () => ({ requireAdmin: requireAdminMock }))
vi.mock("@/lib/db", () => ({ db: { transaction } }))
vi.mock("@/lib/email/notify", () => ({ sendAdminNotification: sendAdminNotificationMock }))
vi.mock("@/lib/admin/settings/queries", () => ({ getOwnerEmail: async () => "owner@x" }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { adjustStock } from "@/lib/admin/inventory/actions"

describe("adjustStock", () => {
	it("rejects deltas that would make stock negative", async () => {
		await expect(
			adjustStock({
				productId: "550e8400-e29b-41d4-a716-446655440000",
				delta: -10,
				reason: "adjustment",
				notes: null,
			}),
		).rejects.toThrow(/insufficient/i)
	})
})
