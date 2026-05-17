import { describe, it, expect, vi, beforeEach } from "vitest"

const { sendEmail, getNotifications } = vi.hoisted(() => ({
	sendEmail: vi.fn(async () => {}),
	getNotifications: vi.fn(),
}))

vi.mock("@/lib/email/client", () => ({ sendEmail }))
vi.mock("@/lib/admin/settings/queries", () => ({ getNotifications }))

import { sendAdminNotification } from "@/lib/email/notify"

beforeEach(() => {
	sendEmail.mockClear()
	getNotifications.mockReset()
})

describe("sendAdminNotification", () => {
	it("sends when event is enabled", async () => {
		getNotifications.mockResolvedValue({
			new_order: { enabled: true, frequency: "immediate", email: "owner@x.co" },
		})
		await sendAdminNotification("new_order", {
			subject: "S",
			html: "<p>H</p>",
			text: "T",
		})
		expect(sendEmail).toHaveBeenCalledWith({
			to: "owner@x.co",
			subject: "S",
			html: "<p>H</p>",
			text: "T",
		})
	})
	it("skips when event is disabled", async () => {
		getNotifications.mockResolvedValue({
			new_order: { enabled: false, frequency: "immediate", email: "owner@x.co" },
		})
		await sendAdminNotification("new_order", { subject: "S", html: "H", text: "T" })
		expect(sendEmail).not.toHaveBeenCalled()
	})
	it("skips when frequency is off", async () => {
		getNotifications.mockResolvedValue({
			new_order: { enabled: true, frequency: "off", email: "owner@x.co" },
		})
		await sendAdminNotification("new_order", { subject: "S", html: "H", text: "T" })
		expect(sendEmail).not.toHaveBeenCalled()
	})
	it("falls back to owner email when event email is null", async () => {
		getNotifications.mockResolvedValue({
			new_order: { enabled: true, frequency: "immediate", email: null },
		})
		await sendAdminNotification(
			"new_order",
			{ subject: "S", html: "H", text: "T" },
			{ ownerEmail: "fallback@x.co" },
		)
		expect(sendEmail).toHaveBeenCalledWith({
			to: "fallback@x.co",
			subject: "S",
			html: "H",
			text: "T",
		})
	})
})
