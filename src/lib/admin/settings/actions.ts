"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { settings } from "@/lib/db/schema"
import { requireOwner } from "@/lib/auth-guards"

export async function updateSetting(key: string, value: unknown): Promise<void> {
	await requireOwner()
	await db
		.insert(settings)
		.values({ key, value })
		.onConflictDoUpdate({
			target: settings.key,
			set: { value, updatedAt: new Date() },
		})
	revalidatePath("/admin/configuracion")
}
