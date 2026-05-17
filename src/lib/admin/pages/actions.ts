"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { pages } from "@/lib/db/schema"
import { requireOwner } from "@/lib/auth-guards"

const PageInput = z.object({
	slug: z
		.string()
		.min(2)
		.max(80)
		.regex(/^[a-z0-9-]+$/),
	title: z.string().min(2).max(120),
	body: z.string().max(20_000),
	metaDescription: z.string().max(280).nullable(),
	published: z.boolean(),
})
type PageInput = z.infer<typeof PageInput>

function bodyJson(body: string) {
	return { kind: "markdown", text: body }
}

export async function createPage(input: PageInput): Promise<void> {
	await requireOwner()
	const data = PageInput.parse(input)
	await db.insert(pages).values({
		slug: data.slug,
		title: data.title,
		body: bodyJson(data.body),
		metaDescription: data.metaDescription,
		publishedAt: data.published ? new Date() : null,
	})
	revalidatePath("/admin/paginas")
}

export async function updatePage(slug: string, input: PageInput): Promise<void> {
	await requireOwner()
	const data = PageInput.parse(input)
	await db
		.update(pages)
		.set({
			slug: data.slug,
			title: data.title,
			body: bodyJson(data.body),
			metaDescription: data.metaDescription,
			publishedAt: data.published ? new Date() : null,
			updatedAt: new Date(),
		})
		.where(eq(pages.slug, slug))
	revalidatePath("/admin/paginas")
	revalidatePath(`/admin/paginas/${data.slug}`)
}
