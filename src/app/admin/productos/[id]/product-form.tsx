"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Route } from "next"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { productFormSchema, type ProductFormInput } from "@/lib/admin/products/schema"
import { createProduct, updateProduct, archiveProduct } from "@/lib/admin/products/actions"
import { Button } from "@/components/ui/button"
import { AttributePicker } from "./attribute-picker"

type Attribute = { id: string; name: string; values: { id: string; name: string }[] }

export function ProductForm({
	mode,
	productId,
	defaultValues,
	attributes,
}: {
	mode: "create" | "edit"
	productId?: string
	defaultValues: ProductFormInput
	attributes: Attribute[]
}) {
	const router = useRouter()
	const [pending, startTransition] = useTransition()
	const [attrSelection, setAttrSelection] = useState<string[]>(defaultValues.attributeValueIds)

	const form = useForm<ProductFormInput>({
		resolver: zodResolver(productFormSchema),
		defaultValues,
	})

	function submit(data: ProductFormInput) {
		startTransition(async () => {
			try {
				const merged = { ...data, attributeValueIds: attrSelection }
				if (mode === "create") {
					const { id } = await createProduct(merged)
					toast.success("Producto creado")
					router.push(`/admin/productos/${id}` as Route)
				} else if (productId) {
					await updateProduct(productId, merged)
					toast.success("Producto actualizado")
					router.refresh()
				}
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Error al guardar")
			}
		})
	}

	return (
		<form onSubmit={form.handleSubmit(submit)} className="space-y-6">
			<Section title="Información">
				<Field label="Nombre" error={form.formState.errors.name?.message}>
					<input
						{...form.register("name")}
						className="w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"
					/>
				</Field>
				<Field label="Slug" error={form.formState.errors.slug?.message}>
					<input
						{...form.register("slug")}
						className="w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"
					/>
				</Field>
				<Field label="Descripción corta">
					<input
						{...form.register("shortDescription")}
						className="w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"
					/>
				</Field>
				<Field label="Descripción">
					<textarea
						{...form.register("description")}
						rows={6}
						className="w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"
					/>
				</Field>
			</Section>

			<Section title="Precio e inventario">
				<Field
					label="Precio (pesos COP, sin decimales)"
					error={form.formState.errors.pricePesos?.message}
				>
					<input
						type="number"
						min={0}
						{...form.register("pricePesos", { valueAsNumber: true })}
						className="w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"
					/>
				</Field>
				<Field label="Umbral stock bajo" error={form.formState.errors.lowStockThreshold?.message}>
					<input
						type="number"
						min={0}
						{...form.register("lowStockThreshold", { valueAsNumber: true })}
						className="w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"
					/>
				</Field>
				<Field label="SKU">
					<input
						{...form.register("skuCode")}
						className="w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"
					/>
				</Field>
				<Field label="Peso (g)">
					<input
						type="number"
						min={0}
						{...form.register("weightGrams", { valueAsNumber: true })}
						className="w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"
					/>
				</Field>
				<Field label="IVA (%)">
					<input
						type="number"
						min={0}
						max={99}
						{...form.register("dianTaxRate", { valueAsNumber: true })}
						className="w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"
					/>
				</Field>
				<Field label="Estado">
					<select
						{...form.register("status")}
						className="w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"
					>
						<option value="draft">Borrador</option>
						<option value="active">Activo</option>
						<option value="archived">Archivado</option>
					</select>
				</Field>
			</Section>

			<Section title="Atributos">
				<AttributePicker
					attributes={attributes}
					value={attrSelection}
					onChange={setAttrSelection}
				/>
			</Section>

			<div className="flex justify-between gap-2">
				{mode === "edit" && productId && (
					<Button
						type="button"
						variant="secondary"
						size="sm"
						className="border-red-700 text-red-700 hover:bg-red-50"
						onClick={() => {
							if (!confirm("¿Archivar este producto?")) return
							startTransition(async () => {
								await archiveProduct(productId)
								toast.success("Archivado")
								router.push("/admin/productos" as Route)
							})
						}}
					>
						Archivar
					</Button>
				)}
				<Button type="submit" size="sm" pending={pending} className="ml-auto">
					{pending ? "Guardando…" : "Guardar"}
				</Button>
			</div>
		</form>
	)
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<section className="rounded-2xl border border-velajuy-wine/10 bg-white p-5">
			<h2 className="mb-4 text-lg font-bold text-velajuy-wine">{title}</h2>
			<div className="space-y-3">{children}</div>
		</section>
	)
}

function Field({
	label,
	error,
	children,
}: {
	label: string
	error?: string
	children: React.ReactNode
}) {
	return (
		<label className="block text-sm text-velajuy-wine">
			<span className="mb-1 block font-medium">{label}</span>
			{children}
			{error && <span className="mt-1 block text-xs text-red-700">{error}</span>}
		</label>
	)
}
