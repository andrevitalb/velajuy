"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Route } from "next"
import { toast } from "sonner"
import { createPage, updatePage } from "@/lib/admin/pages/actions"

type FormState = {
	slug: string
	title: string
	body: string
	metaDescription: string | null
	published: boolean
}

export function PageForm({
	mode,
	slug,
	defaults,
}: {
	mode: "create" | "edit"
	slug?: string
	defaults: FormState
}) {
	const router = useRouter()
	const [form, setForm] = useState<FormState>(defaults)
	const [pending, startTransition] = useTransition()

	function submit(e: React.FormEvent) {
		e.preventDefault()
		startTransition(async () => {
			try {
				if (mode === "create") await createPage(form)
				else if (slug) await updatePage(slug, form)
				toast.success("Guardado")
				router.push("/admin/paginas" as Route)
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Error")
			}
		})
	}

	return (
		<form
			onSubmit={submit}
			className="space-y-4 rounded-2xl border border-velajuy-wine/10 bg-white p-5"
		>
			<label className="block text-sm text-velajuy-wine">
				<span className="mb-1 block font-medium">Slug</span>
				<input
					value={form.slug}
					onChange={(e) => setForm({ ...form, slug: e.target.value })}
					required
					className="w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"
				/>
			</label>
			<label className="block text-sm text-velajuy-wine">
				<span className="mb-1 block font-medium">Título</span>
				<input
					value={form.title}
					onChange={(e) => setForm({ ...form, title: e.target.value })}
					required
					className="w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"
				/>
			</label>
			<label className="block text-sm text-velajuy-wine">
				<span className="mb-1 block font-medium">Cuerpo (Markdown)</span>
				<textarea
					value={form.body}
					onChange={(e) => setForm({ ...form, body: e.target.value })}
					rows={14}
					className="w-full rounded-lg border border-velajuy-wine/20 px-3 py-2 font-mono"
				/>
			</label>
			<label className="block text-sm text-velajuy-wine">
				<span className="mb-1 block font-medium">Meta description</span>
				<input
					value={form.metaDescription ?? ""}
					onChange={(e) => setForm({ ...form, metaDescription: e.target.value || null })}
					maxLength={280}
					className="w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"
				/>
			</label>
			<label className="flex items-center gap-2 text-sm text-velajuy-wine">
				<input
					type="checkbox"
					checked={form.published}
					onChange={(e) => setForm({ ...form, published: e.target.checked })}
				/>
				Publicada
			</label>
			<button
				type="submit"
				disabled={pending}
				className="rounded-lg bg-velajuy-wine px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
			>
				{pending ? "Guardando…" : "Guardar"}
			</button>
		</form>
	)
}
