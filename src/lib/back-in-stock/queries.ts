import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { backInStockSubscriptions } from "@/lib/db/schema"

export async function findByToken(token: string) {
	const [row] = await db
		.select()
		.from(backInStockSubscriptions)
		.where(eq(backInStockSubscriptions.unsubscribeToken, token))
	return row ?? null
}
