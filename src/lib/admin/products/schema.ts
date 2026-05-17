import { z } from "zod"

export const productFormSchema = z.object({
	slug: z
		.string()
		.min(2)
		.max(80)
		.regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
	name: z.string().min(2).max(120),
	shortDescription: z.string().max(280).nullish(),
	description: z.string().max(4000).nullish(),
	status: z.enum(["draft", "active", "archived"]),
	pricePesos: z.number().int().min(0).max(50_000_000),
	weightGrams: z.number().int().min(0).max(10_000).nullable(),
	skuCode: z.string().max(40).nullish(),
	lowStockThreshold: z.number().int().min(0).max(999),
	dianTaxRate: z.number().int().min(0).max(99),
	attributeValueIds: z.array(z.string().uuid()),
})

export type ProductFormInput = z.infer<typeof productFormSchema>
