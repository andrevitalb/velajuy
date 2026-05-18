"use client"

import { useId, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Route } from "next"
import { toast } from "sonner"
import { createPage, updatePage } from "@/lib/admin/pages/actions"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/admin/field"

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
	const baseId = useId()
	const id = (k: string) => `${baseId}-${k}`

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
			<Field label="Slug" htmlFor={id("slug")} required>
				<input
					id={id("slug")}
					value={form.slug}
					onChange={(e) => setForm({ ...form, slug: e.target.value })}
					required
					className={inputCls}
				/>
			</Field>
			<Field label="Título" htmlFor={id("title")} required>
				<input
					id={id("title")}
					value={form.title}
					onChange={(e) => setForm({ ...form, title: e.target.value })}
					required
					className={inputCls}
				/>
			</Field>
			<Field label="Cuerpo (Markdown)" htmlFor={id("body")}>
				<textarea
					id={id("body")}
					value={form.body}
					onChange={(e) => setForm({ ...form, body: e.target.value })}
					rows={14}
					className={`${inputCls} font-mono`}
				/>
			</Field>
			<Field label="Meta description" htmlFor={id("metaDescription")} helper="Máximo 280 caracteres">
				<input
					id={id("metaDescription")}
					value={form.metaDescription ?? ""}
					onChange={(e) => setForm({ ...form, metaDescription: e.target.value || null })}
					maxLength={280}
					className={inputCls}
				/>
			</Field>
			<label className="flex items-center gap-2 text-sm text-velajuy-wine">
				<input
					type="checkbox"
					checked={form.published}
					onChange={(e) => setForm({ ...form, published: e.target.checked })}
				/>
				Publicada
			</label>
			<Button type="submit" size="sm" pending={pending}>
				{pending ? "Guardando…" : "Guardar"}
			</Button>
		</form>
	)
}

const inputCls = "w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"
