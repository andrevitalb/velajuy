import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import {
	attributes,
	attributeValues,
	pages,
	productAttributeValues,
	productImages,
	products,
	settings,
	shippingZones,
	users,
} from "@/lib/db/schema"
import { slugify } from "@/lib/slug"

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

const ATTRIBUTE_DEFAULTS: Array<{
	name: string
	slug: string
	sortOrder: number
	values: string[]
}> = [
	{
		name: "Color",
		slug: "color",
		sortOrder: 10,
		values: ["Rosa pastel", "Lila", "Negro", "Rubio platino", "Castaño chocolate"],
	},
	{
		name: "Largo",
		slug: "largo",
		sortOrder: 20,
		values: ["Corto", "Mediano", "50cm", "70cm", "100cm"],
	},
	{
		name: "Estilo",
		slug: "estilo",
		sortOrder: 30,
		values: ["Liso", "Ondulado", "Rizado", "Bob"],
	},
]

async function upsertAttributes() {
	for (const attr of ATTRIBUTE_DEFAULTS) {
		const existing = await db.select().from(attributes).where(eq(attributes.slug, attr.slug))
		let attributeId: string
		if (existing.length === 0) {
			const [row] = await db
				.insert(attributes)
				.values({ name: attr.name, slug: attr.slug, sortOrder: attr.sortOrder })
				.returning({ id: attributes.id })
			attributeId = row.id
			console.log(`Created attribute: ${attr.name}`)
		} else {
			attributeId = existing[0].id
		}
		for (let i = 0; i < attr.values.length; i++) {
			const valueName = attr.values[i]
			const valueSlug = slugify(valueName)
			const valueExisting = await db
				.select()
				.from(attributeValues)
				.where(eq(attributeValues.attributeId, attributeId))
			if (!valueExisting.some((v) => v.slug === valueSlug)) {
				await db.insert(attributeValues).values({
					attributeId,
					name: valueName,
					slug: valueSlug,
					sortOrder: (i + 1) * 10,
				})
			}
		}
	}
}

const PRODUCT_DEFAULTS: Array<{
	slug: string
	name: string
	short: string
	description: string
	pricePesos: number
	stock: number
	skuCode: string
	color: string
	largo: string
	estilo: string
}> = [
	{
		slug: "rosa-pastel-50cm",
		name: "Peluca Rosa Pastel 50cm",
		short: "Liso rosado kawaii, tono pastel uniforme.",
		description: "Fibra sintética premium · Lavable · Cabeza ajustable · 50cm de largo.",
		pricePesos: 220_000,
		stock: 5,
		skuCode: "VLJ-001",
		color: "Rosa pastel",
		largo: "50cm",
		estilo: "Liso",
	},
	{
		slug: "lila-ondulado-70cm",
		name: "Peluca Lila Ondulado 70cm",
		short: "Ondas suaves lila para un look Y2K dulce.",
		description: "Fibra resistente al calor moderado · Ajustable · 70cm.",
		pricePesos: 260_000,
		stock: 3,
		skuCode: "VLJ-002",
		color: "Lila",
		largo: "70cm",
		estilo: "Ondulado",
	},
	{
		slug: "bob-negro-corto",
		name: "Peluca Bob Negro",
		short: "Bob clásico, negro azabache, brillante.",
		description: "Corte recto · Cabeza ajustable · Para uso diario.",
		pricePesos: 180_000,
		stock: 8,
		skuCode: "VLJ-003",
		color: "Negro",
		largo: "Corto",
		estilo: "Bob",
	},
	{
		slug: "rubio-platino-100cm",
		name: "Peluca Rubio Platino XL 100cm",
		short: "Largo extra rubio platino para impacto total.",
		description: "100cm · Liso brillante · Ajustable.",
		pricePesos: 320_000,
		stock: 0,
		skuCode: "VLJ-004",
		color: "Rubio platino",
		largo: "100cm",
		estilo: "Liso",
	},
	{
		slug: "castano-rizado-mediano",
		name: "Peluca Castaño Chocolate Rizado",
		short: "Rizos definidos, tono chocolate cálido.",
		description: "Largo mediano · Rizos resistentes · Ajustable.",
		pricePesos: 240_000,
		stock: 4,
		skuCode: "VLJ-005",
		color: "Castaño chocolate",
		largo: "Mediano",
		estilo: "Rizado",
	},
	{
		slug: "rosa-pastel-corto-bob",
		name: "Peluca Rosa Pastel Bob",
		short: "Bob corto en rosa pastel — la consentida.",
		description: "Bob asimétrico · Rosa pastel · Ajustable.",
		pricePesos: 200_000,
		stock: 6,
		skuCode: "VLJ-006",
		color: "Rosa pastel",
		largo: "Corto",
		estilo: "Bob",
	},
]

async function upsertProducts() {
	const allValues = await db.select().from(attributeValues)
	const valueIdByCompound = new Map<string, string>()
	const attrRows = await db.select().from(attributes)
	const attrSlugById = new Map(attrRows.map((a) => [a.id, a.slug]))
	for (const v of allValues) {
		const attrSlug = attrSlugById.get(v.attributeId)
		if (!attrSlug) continue
		valueIdByCompound.set(`${attrSlug}:${v.slug}`, v.id)
	}

	function lookup(attrSlug: string, name: string): string {
		const id = valueIdByCompound.get(`${attrSlug}:${slugify(name)}`)
		if (!id) throw new Error(`Missing attribute value ${attrSlug}:${name}`)
		return id
	}

	for (const p of PRODUCT_DEFAULTS) {
		const existing = await db.select().from(products).where(eq(products.slug, p.slug))
		if (existing.length > 0) continue
		const [productRow] = await db
			.insert(products)
			.values({
				slug: p.slug,
				name: p.name,
				shortDescription: p.short,
				description: p.description,
				status: "active",
				priceAmount: p.pricePesos * 100,
				priceCurrency: "COP",
				stockQuantity: p.stock,
				skuCode: p.skuCode,
				dianTaxRate: 19,
			})
			.returning({ id: products.id })

		const [imageRow] = await db
			.insert(productImages)
			.values({
				productId: productRow.id,
				url: "/samples/placeholder-wig.png",
				altText: p.name,
				sortOrder: 0,
				width: 600,
				height: 600,
			})
			.returning({ id: productImages.id })

		await db
			.update(products)
			.set({ primaryImageId: imageRow.id })
			.where(eq(products.id, productRow.id))

		await db.insert(productAttributeValues).values([
			{ productId: productRow.id, attributeValueId: lookup("color", p.color) },
			{ productId: productRow.id, attributeValueId: lookup("largo", p.largo) },
			{ productId: productRow.id, attributeValueId: lookup("estilo", p.estilo) },
		])
		console.log(`Created product: ${p.name}`)
	}
}

const PAGE_DEFAULTS = [
	{
		slug: "pdp-cuidado",
		title: "Cuidado",
		body: "Lava la peluca con shampoo suave en agua fría. No la frotes. Sécala al aire libre sobre un soporte. Evita el calor directo si no es resistente.",
	},
	{
		slug: "pdp-envio",
		title: "Envío",
		body: "Enviamos a toda Colombia. En Bucaramanga y AMB también ofrecemos contra entrega. Envío gratis comprando 3 pelucas o más.",
	},
	{
		slug: "pdp-devoluciones",
		title: "Devoluciones",
		body: "Las pelucas son artículos de uso personal y, por higiene, no se aceptan devoluciones. Si tienes dudas sobre el producto, escríbenos antes de comprar.",
	},
]

async function upsertPages() {
	for (const p of PAGE_DEFAULTS) {
		const existing = await db.select().from(pages).where(eq(pages.slug, p.slug))
		if (existing.length === 0) {
			await db.insert(pages).values({
				slug: p.slug,
				title: p.title,
				body: p.body,
				publishedAt: new Date(),
			})
			console.log(`Created page: ${p.slug}`)
		}
	}
}

async function main() {
	await upsertOwner()
	await upsertSettings()
	await upsertZones()
	await upsertAttributes()
	await upsertProducts()
	await upsertPages()
	console.log("Seed complete.")
	process.exit(0)
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})
