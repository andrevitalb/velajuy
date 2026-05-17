import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { pages } from "@/lib/db/schema"

export async function listPages() {
	return db.select().from(pages).orderBy(pages.slug)
}

export async function getPageBySlug(slug: string) {
	const [row] = await db.select().from(pages).where(eq(pages.slug, slug))
	return row ?? null
}
