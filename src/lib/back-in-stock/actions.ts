"use server"

import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { z } from "zod"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { backInStockSubscriptions } from "@/lib/db/schema"
import { newUnsubscribeToken } from "./token"

const subscribeSchema = z.object({
	productId: z.uuid(),
	email: z.email(),
})

export type SubscribeResult = { ok: true } | { ok: false; error: string }

export async function subscribeBackInStock(input: unknown): Promise<SubscribeResult> {
	const parsed = subscribeSchema.safeParse(input)
	if (!parsed.success) {
		return { ok: false, error: "Email inválido" }
	}
	const { productId, email } = parsed.data
	const session = await auth.api.getSession({ headers: await headers() })

	const existing = await db
		.select()
		.from(backInStockSubscriptions)
		.where(
			and(
				eq(backInStockSubscriptions.productId, productId),
				eq(backInStockSubscriptions.email, email),
			),
		)
	if (existing.length > 0) {
		return { ok: true }
	}

	await db.insert(backInStockSubscriptions).values({
		productId,
		email,
		userId: session?.user.id ?? null,
		unsubscribeToken: newUnsubscribeToken(),
	})
	return { ok: true }
}

export async function unsubscribeBackInStock(token: string): Promise<SubscribeResult> {
	if (!token) return { ok: false, error: "Token requerido" }
	const result = await db
		.delete(backInStockSubscriptions)
		.where(eq(backInStockSubscriptions.unsubscribeToken, token))
		.returning({ id: backInStockSubscriptions.id })
	if (result.length === 0) return { ok: false, error: "Suscripción no encontrada" }
	return { ok: true }
}
