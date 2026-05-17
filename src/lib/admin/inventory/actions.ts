"use server"

import { eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { products, stockMovements } from "@/lib/db/schema"
import { requireAdmin } from "@/lib/auth-guards"
import { sendAdminNotification } from "@/lib/email/notify"
import { getOwnerEmail } from "@/lib/admin/settings/queries"
import { adminLowStockEmail } from "@/lib/email/templates/admin-low-stock"

const AdjustInput = z.object({
	productId: z.string().uuid(),
	delta: z
		.number()
		.int()
		.refine((n) => n !== 0, "Delta cannot be zero"),
	reason: z.enum(["adjustment", "restock", "return"]),
	notes: z.string().max(280).nullable(),
})
export type AdjustInput = z.infer<typeof AdjustInput>

export async function adjustStock(input: AdjustInput): Promise<void> {
	const session = await requireAdmin()
	const data = AdjustInput.parse(input)

	let triggeredLowStock = false
	let productName = ""
	let newQuantity = 0

	await db.transaction(async (tx) => {
		const [current] = await tx
			.select({
				stockQuantity: products.stockQuantity,
				lowStockThreshold: products.lowStockThreshold,
				name: products.name,
			})
			.from(products)
			.where(eq(products.id, data.productId))
		if (!current) throw new Error("Producto no encontrado")
		newQuantity = current.stockQuantity + data.delta
		if (newQuantity < 0) throw new Error("Stock insufficient for this adjustment")
		productName = current.name

		await tx
			.update(products)
			.set({ stockQuantity: sql`${products.stockQuantity} + ${data.delta}` })
			.where(eq(products.id, data.productId))

		await tx.insert(stockMovements).values({
			productId: data.productId,
			delta: data.delta,
			reason: data.reason,
			staffId: session.user.id,
			notes: data.notes,
		})

		if (
			newQuantity <= current.lowStockThreshold &&
			current.stockQuantity > current.lowStockThreshold
		) {
			triggeredLowStock = true
		}
	})

	if (triggeredLowStock) {
		const ownerEmail = await getOwnerEmail()
		const tmpl = adminLowStockEmail({ productName, quantity: newQuantity })
		await sendAdminNotification("stock_low", tmpl, { ownerEmail })
	}

	revalidatePath("/admin/inventario")
}
