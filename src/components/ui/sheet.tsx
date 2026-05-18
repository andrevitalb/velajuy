"use client"

import { X } from "lucide-react"
import { useEffect, useRef } from "react"

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
	const panelRef = useRef<HTMLDivElement>(null)
	const closeButtonRef = useRef<HTMLButtonElement>(null)
	const previouslyFocused = useRef<HTMLElement | null>(null)

	// Sheet lifecycle: when `open` flips true we (1) lock body scroll preserving
	// any pre-existing inline style, (2) remember the trigger that opened the
	// sheet so we can restore focus on close, (3) move focus into the panel
	// after paint, and (4) install a focus trap on Tab/Shift+Tab. The cleanup
	// runs on close (button, ESC, route change, or unmount) and restores body
	// scroll and focus to the previously focused element.
	useEffect(() => {
		if (!open) return
		previouslyFocused.current = document.activeElement as HTMLElement | null
		const prevOverflow = document.body.style.overflow
		document.body.style.overflow = "hidden"
		queueMicrotask(() => {
			closeButtonRef.current?.focus()
		})
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") {
				onClose()
				return
			}
			if (e.key !== "Tab") return
			const panel = panelRef.current
			if (!panel) return
			const focusables = panel.querySelectorAll<HTMLElement>(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
			)
			if (focusables.length === 0) return
			const first = focusables[0]
			const last = focusables[focusables.length - 1]
			const active = document.activeElement as HTMLElement | null
			if (e.shiftKey) {
				if (active === first || !panel.contains(active)) {
					e.preventDefault()
					last.focus()
				}
			} else {
				if (active === last) {
					e.preventDefault()
					first.focus()
				}
			}
		}
		document.addEventListener("keydown", onKey)
		return () => {
			document.removeEventListener("keydown", onKey)
			document.body.style.overflow = prevOverflow
			previouslyFocused.current?.focus?.()
		}
	}, [open, onClose])

	if (!open) return null
	return (
		<div
			ref={panelRef}
			role="dialog"
			aria-modal="true"
			aria-label={title}
			className="fixed inset-0 z-50"
		>
			<div onClick={onClose} className="absolute inset-0 animate-fade-in bg-velajuy-wine/40" />
			<div className="absolute inset-x-0 bottom-0 max-h-[85vh] animate-slide-up overflow-y-auto rounded-t-2xl bg-velajuy-cream p-6">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-lg font-semibold text-velajuy-wine">{title}</h2>
					<button
						ref={closeButtonRef}
						type="button"
						onClick={onClose}
						aria-label="Cerrar"
						className="inline-flex size-11 items-center justify-center rounded-full text-velajuy-wine transition-all duration-150 hover:bg-velajuy-pink-soft active:scale-95 active:opacity-90"
					>
						<X className="size-5" />
					</button>
				</div>
				{children}
			</div>
		</div>
	)
}
