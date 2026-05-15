import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { settings, shippingZones, users } from "@/lib/db/schema"

const OWNER_EMAIL = process.env.SEED_OWNER_EMAIL ?? "andre.vital@metalab.com"

async function upsertOwner() {
	const existing = await db.select().from(users).where(eq(users.email, OWNER_EMAIL))
	if (existing.length === 0) {
		await db.insert(users).values({
			email: OWNER_EMAIL,
			name: "Owner",
			role: "owner",
			emailVerified: true,
		})
		console.log(`Created owner: ${OWNER_EMAIL}`)
	} else if (existing[0].role !== "owner") {
		await db.update(users).set({ role: "owner" }).where(eq(users.email, OWNER_EMAIL))
		console.log(`Promoted to owner: ${OWNER_EMAIL}`)
	} else {
		console.log(`Owner exists: ${OWNER_EMAIL}`)
	}
}

const SETTING_DEFAULTS: Record<string, unknown> = {
	shop_name: "Velajuy Pelucas",
	contact_email: "hola@velajuy.com",
	contact_phone: "+57 310 555 8001",
	social_instagram: "@velajuy_pelucas",
	free_shipping_min_quantity: 3,
	low_stock_threshold_default: 2,
	iva_default_rate: 19,
	notifications: {
		new_order: { enabled: true, frequency: "immediate", email: null },
		payment_received: { enabled: true, frequency: "immediate", email: null },
		stock_low: { enabled: true, frequency: "immediate", email: null },
		cod_ready: { enabled: true, frequency: "immediate", email: null },
	},
}

async function upsertSettings() {
	for (const [key, value] of Object.entries(SETTING_DEFAULTS)) {
		const existing = await db.select().from(settings).where(eq(settings.key, key))
		if (existing.length === 0) {
			await db.insert(settings).values({ key, value })
			console.log(`Created setting: ${key}`)
		}
	}
}

const ZONE_DEFAULTS = [
	{
		name: "Bucaramanga",
		country: "CO",
		department: "Santander",
		cities: ["Bucaramanga"],
		baseRateAmount: 1_000_000,
		currencyCode: "COP",
		courierDefault: "inter",
		allowsCod: true,
		sortOrder: 10,
	},
	{
		name: "Área Metropolitana de Bucaramanga",
		country: "CO",
		department: "Santander",
		cities: ["Floridablanca", "Piedecuesta", "Girón"],
		baseRateAmount: 1_200_000,
		currencyCode: "COP",
		courierDefault: "inter",
		allowsCod: true,
		sortOrder: 20,
	},
	{
		name: "Resto del país",
		country: "CO",
		department: "*",
		cities: null,
		baseRateAmount: 2_500_000,
		currencyCode: "COP",
		courierDefault: "servientrega",
		allowsCod: false,
		sortOrder: 1000,
	},
]

async function upsertZones() {
	for (const zone of ZONE_DEFAULTS) {
		const existing = await db.select().from(shippingZones).where(eq(shippingZones.name, zone.name))
		if (existing.length === 0) {
			await db.insert(shippingZones).values(zone)
			console.log(`Created zone: ${zone.name}`)
		}
	}
}

async function main() {
	await upsertOwner()
	await upsertSettings()
	await upsertZones()
	console.log("Seed complete.")
	process.exit(0)
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})
