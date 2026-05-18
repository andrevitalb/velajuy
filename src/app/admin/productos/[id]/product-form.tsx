"use client"

import { useEffect, useId, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Route } from "next"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { productFormSchema, type ProductFormInput } from "@/lib/admin/products/schema"
import { createProduct, updateProduct, archiveProduct } from "@/lib/admin/products/actions"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/admin/field"
import { AttributePicker } from "./attribute-picker"

type Attribute = { id: string; name: string; values: { id: string; name: string }[] }

const FIELD_ORDER: (keyof ProductFormInput)[] = [
	"name",
	"slug",
	"shortDescription",
	"description",
	"pricePesos",
	"lowStockThreshold",
	"skuCode",
	"weightGrams",
	"dianTaxRate",
	"status",
]

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

	const errors = form.formState.errors
	const submitCount = form.formState.submitCount

	// IDs for fields so labels and error messages associate correctly.
	const baseId = useId()
	const id = (key: string) => `${baseId}-${key}`

	// Focus-on-error: when validation produces errors after a submit, focus the
	// first errored field in declared order.
	useEffect(() => {
		if (submitCount === 0) return
		for (const key of FIELD_ORDER) {
			if (errors[key]) {
				document.getElementById(id(key))?.focus()
				break
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [submitCount, errors])

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
		<form onSubmit={form.handleSubmit(submit)} className="space-y-6" noValidate>
			<Section title="Información">
				<Field label="Nombre" htmlFor={id("name")} required error={errors.name?.message}>
					<input
						id={id("name")}
						aria-invalid={errors.name ? true : undefined}
						aria-describedby={errors.name ? `${id("name")}-error` : undefined}
						{...form.register("name")}
						className={inputCls}
					/>
				</Field>
				<Field label="Slug" htmlFor={id("slug")} required error={errors.slug?.message}>
					<input
						id={id("slug")}
						aria-invalid={errors.slug ? true : undefined}
						aria-describedby={errors.slug ? `${id("slug")}-error` : undefined}
						{...form.register("slug")}
						className={inputCls}
					/>
				</Field>
				<Field label="Descripción corta" htmlFor={id("shortDescription")}>
					<input
						id={id("shortDescription")}
						{...form.register("shortDescription")}
						className={inputCls}
					/>
				</Field>
				<Field label="Descripción" htmlFor={id("description")}>
					<textarea
						id={id("description")}
						{...form.register("description")}
						rows={6}
						className={inputCls}
					/>
				</Field>
			</Section>

			<Section title="Precio e inventario">
				<Field
					label="Precio (pesos COP, sin decimales)"
					htmlFor={id("pricePesos")}
					required
					error={errors.pricePesos?.message}
				>
					<input
						id={id("pricePesos")}
						type="number"
						min={0}
						aria-invalid={errors.pricePesos ? true : undefined}
						aria-describedby={errors.pricePesos ? `${id("pricePesos")}-error` : undefined}
						{...form.register("pricePesos", { valueAsNumber: true })}
						className={inputCls}
					/>
				</Field>
				<Field
					label="Umbral stock bajo"
					htmlFor={id("lowStockThreshold")}
					error={errors.lowStockThreshold?.message}
				>
					<input
						id={id("lowStockThreshold")}
						type="number"
						min={0}
						aria-invalid={errors.lowStockThreshold ? true : undefined}
						aria-describedby={
							errors.lowStockThreshold ? `${id("lowStockThreshold")}-error` : undefined
						}
						{...form.register("lowStockThreshold", { valueAsNumber: true })}
						className={inputCls}
					/>
				</Field>
				<Field label="SKU" htmlFor={id("skuCode")}>
					<input id={id("skuCode")} {...form.register("skuCode")} className={inputCls} />
				</Field>
				<Field label="Peso (g)" htmlFor={id("weightGrams")}>
					<input
						id={id("weightGrams")}
						type="number"
						min={0}
						{...form.register("weightGrams", { valueAsNumber: true })}
						className={inputCls}
					/>
				</Field>
				<Field label="IVA (%)" htmlFor={id("dianTaxRate")}>
					<input
						id={id("dianTaxRate")}
						type="number"
						min={0}
						max={99}
						{...form.register("dianTaxRate", { valueAsNumber: true })}
						className={inputCls}
					/>
				</Field>
				<Field label="Estado" htmlFor={id("status")}>
					<select id={id("status")} {...form.register("status")} className={inputCls}>
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
						variant="danger"
						size="sm"
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

const inputCls = "w-full rounded-lg border border-velajuy-wine/20 px-3 py-2"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<section className="rounded-2xl border border-velajuy-wine/10 bg-white p-5">
			<h2 className="mb-4 text-lg font-bold text-velajuy-wine">{title}</h2>
			<div className="space-y-3">{children}</div>
		</section>
	)
}
