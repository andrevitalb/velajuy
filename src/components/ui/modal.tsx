"use client"

import { X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef } from "react"

/**
 * Modal — accessible dialog with focus trap.
 *
 * Lifecycle contract: this component MUST be conditionally rendered (mounted on
 * open, unmounted on close), NOT toggled via an `open` prop. Focus restoration
 * relies on the effect cleanup, which only fires on unmount.
 *
 * Used via Next.js parallel routes (`@modal/(.)*`) which mount/unmount the modal.
 */
export function Modal({
	children,
	onClose,
	label,
}: {
	children: React.ReactNode
	onClose?: () => void
	label?: string
}) {
	const router = useRouter()
	const dialogRef = useRef<HTMLDialogElement>(null)
	const previouslyFocused = useRef<HTMLElement | null>(null)

	const handleClose = useCallback(() => {
		if (onClose) onClose()
		else router.back()
	}, [onClose, router])

	useEffect(() => {
		const el = dialogRef.current
		if (!el) return
		previouslyFocused.current = document.activeElement as HTMLElement | null
		if (!el.open) el.showModal()
		const firstFocusable = el.querySelector<HTMLElement>(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
		)
		firstFocusable?.focus()
		return () => previouslyFocused.current?.focus?.()
	}, [])

	return (
		<dialog
			ref={dialogRef}
			aria-modal="true"
			aria-label={label}
			onClose={handleClose}
			onClick={(e) => {
				if (e.target === dialogRef.current) handleClose()
			}}
			className="m-auto w-full max-w-3xl rounded-2xl bg-white p-0 text-velajuy-wine outline-none backdrop:bg-velajuy-wine/40 backdrop:backdrop-blur-sm"
		>
			<button
				type="button"
				onClick={handleClose}
				aria-label="Cerrar"
				className="absolute right-4 top-4 inline-flex size-11 items-center justify-center rounded-full bg-velajuy-pink-soft text-velajuy-wine transition-all duration-150 hover:bg-velajuy-pink hover:scale-105 active:scale-95"
			>
				<X size={20} />
			</button>
			<div className="p-6">{children}</div>
		</dialog>
	)
}
