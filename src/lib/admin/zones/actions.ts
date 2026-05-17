"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { shippingZones } from "@/lib/db/schema"
import { requireOwner } from "@/lib/auth-guards"

const ZoneInput = z.object({
	name: z.string().min(2).max(80),
	country: z.string().length(2).default("CO"),
	department: z.string().min(2).max(60),
	cities: z.array(z.string().min(1)).nullable(),
	baseRatePesos: z.number().int().min(0).max(10_000_000),
	courierDefault: z.string().nullable(),
	allowsCod: z.boolean(),
	isActive: z.boolean(),
	sortOrder: z.number().int(),
})

export type ZoneInput = z.infer<typeof ZoneInput>

export async function createZone(input: ZoneInput): Promise<void> {
	await requireOwner()
	const data = ZoneInput.parse(input)
	await db.insert(shippingZones).values({
		name: data.name,
		country: data.country,
		department: data.department,
		cities: data.cities,
		baseRateAmount: data.baseRatePesos * 100,
		courierDefault: data.courierDefault,
		allowsCod: data.allowsCod,
		isActive: data.isActive,
		sortOrder: data.sortOrder,
	})
	revalidatePath("/admin/zonas")
}

export async function updateZone(id: string, input: ZoneInput): Promise<void> {
	await requireOwner()
	const data = ZoneInput.parse(input)
	await db
		.update(shippingZones)
		.set({
			name: data.name,
			country: data.country,
			department: data.department,
			cities: data.cities,
			baseRateAmount: data.baseRatePesos * 100,
			courierDefault: data.courierDefault,
			allowsCod: data.allowsCod,
			isActive: data.isActive,
			sortOrder: data.sortOrder,
			updatedAt: new Date(),
		})
		.where(eq(shippingZones.id, id))
	revalidatePath("/admin/zonas")
}

export async function deactivateZone(id: string): Promise<void> {
	await requireOwner()
	await db.update(shippingZones).set({ isActive: false }).where(eq(shippingZones.id, id))
	revalidatePath("/admin/zonas")
}
