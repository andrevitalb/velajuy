import Link from "next/link"
import type { Route } from "next"
import { PageHeader } from "@/components/admin/page-header"
import { listPages } from "@/lib/admin/pages/queries"

export default async function PagesIndex() {
	const rows = await listPages()
	return (
		<>
			<PageHeader
				title="Páginas"
				actions={
					<Link
						href={"/admin/paginas/nueva" as Route}
						className="rounded-lg bg-velajuy-wine px-3 py-2 text-sm font-medium text-white"
					>
						Nueva página
					</Link>
				}
			/>
			<ul className="space-y-2">
				{rows.map((p) => (
					<li key={p.id} className="rounded-xl border border-velajuy-wine/10 bg-white p-4">
						<Link
							href={`/admin/paginas/${p.slug}` as Route}
							className="font-medium text-velajuy-wine underline"
						>
							{p.title}
						</Link>
						<p className="text-xs text-velajuy-wine-soft">
							/{p.slug} · {p.publishedAt ? "Publicada" : "Borrador"}
						</p>
					</li>
				))}
			</ul>
		</>
	)
}
