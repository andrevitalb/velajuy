"use client"

import { X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"

export function Modal({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
	const router = useRouter()
	const dialogRef = useRef<HTMLDialogElement>(null)

	useEffect(() => {
		const el = dialogRef.current
		if (!el) return
		if (!el.open) el.showModal()
	}, [])

	function handleClose() {
		if (onClose) onClose()
		else router.back()
	}

	return (
		<dialog
			ref={dialogRef}
			onClose={handleClose}
			onClick={(e) => {
				if (e.target === dialogRef.current) handleClose()
			}}
			className="m-auto w-full max-w-3xl rounded-2xl bg-white p-0 text-velajuy-wine backdrop:bg-velajuy-wine/40 backdrop:backdrop-blur-sm"
		>
			<button
				type="button"
				onClick={handleClose}
				aria-label="Cerrar"
				className="absolute right-4 top-4 rounded-full bg-velajuy-pink-soft p-2 text-velajuy-wine"
			>
				<X size={18} />
			</button>
			<div className="p-6">{children}</div>
		</dialog>
	)
}
