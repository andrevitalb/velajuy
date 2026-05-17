"use client"

import { X } from "lucide-react"
import { useEffect } from "react"

export function Sheet({
	open,
	onClose,
	title,
	children,
}: {
	open: boolean
	onClose: () => void
	title: string
	children: React.ReactNode
}) {
	useEffect(() => {
		if (!open) return
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") onClose()
		}
		document.body.style.overflow = "hidden"
		window.addEventListener("keydown", onKey)
		return () => {
			document.body.style.overflow = ""
			window.removeEventListener("keydown", onKey)
		}
	}, [open, onClose])

	if (!open) return null
	return (
		<div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-50">
			<div onClick={onClose} className="absolute inset-0 animate-fade-in bg-velajuy-wine/40" />
			<div className="absolute inset-x-0 bottom-0 max-h-[85vh] animate-slide-up overflow-y-auto rounded-t-2xl bg-velajuy-cream p-6">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-lg font-semibold text-velajuy-wine">{title}</h2>
					<button
						type="button"
						onClick={onClose}
						aria-label="Cerrar"
						className="inline-flex size-11 items-center justify-center rounded-full text-velajuy-wine hover:bg-velajuy-pink-soft"
					>
						<X className="size-5" />
					</button>
				</div>
				{children}
			</div>
		</div>
	)
}
