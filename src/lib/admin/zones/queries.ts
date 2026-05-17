import { db } from "@/lib/db"
import { shippingZones } from "@/lib/db/schema"

export async function listZones() {
	return db.select().from(shippingZones).orderBy(shippingZones.sortOrder)
}
