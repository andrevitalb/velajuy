"use client"

import { useRef, useState, useTransition } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { Plus, X, GripVertical } from "lucide-react"
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core"
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	rectSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { attachUploadedImage, deleteImage, reorderImages } from "@/lib/admin/products/actions"

type GalleryImage = { id: string; url: string; altText: string }

export function ImageGallery({
	productId,
	images: initialImages,
}: {
	productId: string
	images: GalleryImage[]
}) {
	const [images, setImages] = useState(initialImages)
	const fileRef = useRef<HTMLInputElement>(null)
	const [pending, startTransition] = useTransition()
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	)

	function onDragEnd(event: DragEndEvent) {
		const { active, over } = event
		if (!over || active.id === over.id) return
		const oldIndex = images.findIndex((img) => img.id === active.id)
		const newIndex = images.findIndex((img) => img.id === over.id)
		const prev = images
		const reordered = arrayMove(images, oldIndex, newIndex)
		setImages(reordered)
		startTransition(async () => {
			try {
				await reorderImages(
					productId,
					reordered.map((img) => img.id),
				)
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "No se pudo reordenar")
				setImages(prev)
			}
		})
	}

	async function handleFile(file: File) {
		try {
			const presignRes = await fetch("/api/r2/upload", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					productId,
					filename: file.name,
					contentType: file.type,
					contentLength: file.size,
				}),
			})
			if (!presignRes.ok) throw new Error("No se pudo obtener URL de subida")
			const { uploadUrl, publicUrl } = (await presignRes.json()) as {
				uploadUrl: string
				publicUrl: string
			}
			const putRes = await fetch(uploadUrl, {
				method: "PUT",
				headers: { "content-type": file.type },
				body: file,
			})
			if (!putRes.ok) throw new Error("Falló la subida a R2")
			const { id } = await attachUploadedImage({ productId, url: publicUrl })
			setImages((prev) => [...prev, { id, url: publicUrl, altText: "" }])
			toast.success("Imagen subida")
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error al subir imagen")
		}
	}

	function onPick(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		if (file) handleFile(file)
		e.target.value = ""
	}

	function remove(id: string) {
		if (!confirm("¿Eliminar esta imagen?")) return
		startTransition(async () => {
			await deleteImage(productId, id)
			setImages((prev) => prev.filter((img) => img.id !== id))
			toast.success("Imagen eliminada")
		})
	}

	return (
		<section className="rounded-2xl border border-velajuy-wine/10 bg-white p-5">
			<h2 className="mb-4 text-lg font-bold text-velajuy-wine">
				Imágenes{" "}
				<span className="text-sm font-normal text-velajuy-wine-soft">
					(la primera es la principal)
				</span>
			</h2>
			<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
				<SortableContext items={images.map((img) => img.id)} strategy={rectSortingStrategy}>
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
						{images.map((img) => (
							<SortableTile
								key={img.id}
								image={img}
								onRemove={() => remove(img.id)}
								disabled={pending}
							/>
						))}
						<button
							type="button"
							onClick={() => fileRef.current?.click()}
							className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-velajuy-wine/30 text-velajuy-wine transition-all duration-150 hover:bg-velajuy-pink-soft active:scale-95 active:opacity-90"
						>
							<Plus className="size-6" />
						</button>
					</div>
				</SortableContext>
			</DndContext>
			<input
				ref={fileRef}
				type="file"
				accept="image/jpeg,image/png,image/webp,image/avif"
				hidden
				onChange={onPick}
			/>
		</section>
	)
}

function SortableTile({
	image,
	onRemove,
	disabled,
}: {
	image: GalleryImage
	onRemove: () => void
	disabled: boolean
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: image.id,
	})

	return (
		<div
			ref={setNodeRef}
			{...attributes}
			style={{ transform: CSS.Transform.toString(transform), transition }}
			className={`relative aspect-square overflow-hidden rounded-xl border border-velajuy-wine/10${isDragging ? " opacity-60" : ""}`}
		>
			<Image
				src={image.url}
				alt={image.altText || "Imagen del producto"}
				fill
				className="object-cover"
				sizes="(min-width: 640px) 200px, 50vw"
			/>
			<button
				type="button"
				{...listeners}
				className="absolute left-1 top-1 rounded bg-black/40 p-1 text-white"
				aria-label="Mover"
			>
				<GripVertical className="size-4" />
			</button>
			<button
				type="button"
				onClick={onRemove}
				disabled={disabled}
				className="absolute right-1 top-1 rounded bg-danger/80 p-1 text-white transition-all duration-150 hover:bg-danger active:scale-95 active:opacity-90 disabled:opacity-50"
				aria-label="Eliminar imagen"
			>
				<X className="size-4" />
			</button>
		</div>
	)
}
