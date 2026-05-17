import { describe, it, expect } from "vitest"
import { canTransition, nextStatus, type OrderStatus } from "@/lib/admin/orders/order-state"

describe("order-state", () => {
	it("paid → preparing is legal", () => {
		expect(canTransition("paid", "preparing")).toBe(true)
	})
	it("preparing → shipped is legal", () => {
		expect(canTransition("preparing", "shipped")).toBe(true)
	})
	it("shipped → delivered is legal", () => {
		expect(canTransition("shipped", "delivered")).toBe(true)
	})
	it("preparing → cancelled is legal (pre-shipment)", () => {
		expect(canTransition("preparing", "cancelled")).toBe(true)
	})
	it("shipped → cancelled is illegal", () => {
		expect(canTransition("shipped", "cancelled")).toBe(false)
	})
	it("delivered → anything is illegal", () => {
		const all: OrderStatus[] = [
			"pending_payment",
			"paid",
			"preparing",
			"shipped",
			"delivered",
			"cancelled",
			"failed",
		]
		for (const target of all) {
			expect(canTransition("delivered", target)).toBe(false)
		}
	})
	it("pending_payment → paid is legal", () => {
		expect(canTransition("pending_payment", "paid")).toBe(true)
	})
	it("pending_payment → failed is legal (expiry)", () => {
		expect(canTransition("pending_payment", "failed")).toBe(true)
	})
	it("nextStatus returns the canonical forward step", () => {
		expect(nextStatus("paid")).toBe("preparing")
		expect(nextStatus("preparing")).toBe("shipped")
		expect(nextStatus("shipped")).toBe("delivered")
		expect(nextStatus("delivered")).toBeNull()
	})
})
