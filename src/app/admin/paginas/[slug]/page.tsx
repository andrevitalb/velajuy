import { notFound } from "next/navigation"
import { PageHeader } from "@/components/admin/page-header"
import { getPageBySlug } from "@/lib/admin/pages/queries"
import { PageForm } from "../page-form"

export default async function EditPagePage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params
	const page = await getPageBySlug(slug)
	if (!page) notFound()
	const body =
		page.body && typeof page.body === "object" && "text" in page.body
			? String((page.body as { text: string }).text)
			: ""

	return (
		<>
			<PageHeader title={page.title} subtitle={`/${page.slug}`} />
			<PageForm
				mode="edit"
				slug={page.slug}
				defaults={{
					slug: page.slug,
					title: page.title,
					body,
					metaDescription: page.metaDescription,
					published: !!page.publishedAt,
				}}
			/>
		</>
	)
}
