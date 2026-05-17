export type OrderStatus =
	| "pending_payment"
	| "paid"
	| "preparing"
	| "shipped"
	| "delivered"
	| "cancelled"
	| "failed"

const LEGAL: Record<OrderStatus, OrderStatus[]> = {
	pending_payment: ["paid", "cancelled", "failed"],
	paid: ["preparing", "cancelled"],
	preparing: ["shipped", "cancelled"],
	shipped: ["delivered"],
	delivered: [],
	cancelled: [],
	failed: [],
}

const FORWARD: Partial<Record<OrderStatus, OrderStatus>> = {
	paid: "preparing",
	preparing: "shipped",
	shipped: "delivered",
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
	return LEGAL[from]?.includes(to) ?? false
}

export function nextStatus(from: OrderStatus): OrderStatus | null {
	return FORWARD[from] ?? null
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
	if (!canTransition(from, to)) {
		throw new Error(`Illegal order transition: ${from} → ${to}`)
	}
}

/** Timestamps to set on a status change. */
export function timestampsFor(
	to: OrderStatus,
	now: Date = new Date(),
): Partial<{
	paidAt: Date
	shippedAt: Date
	deliveredAt: Date
	cancelledAt: Date
}> {
	switch (to) {
		case "paid":
			return { paidAt: now }
		case "shipped":
			return { shippedAt: now }
		case "delivered":
			return { deliveredAt: now }
		case "cancelled":
			return { cancelledAt: now }
		default:
			return {}
	}
}
