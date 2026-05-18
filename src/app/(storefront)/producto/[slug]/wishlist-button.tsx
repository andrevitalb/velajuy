"use client"

import type { Route } from "next"
import { Heart } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { addToWishlist, removeFromWishlist } from "@/lib/wishlist/actions"
import { cn } from "@/lib/cn"

export function WishlistButton({
	productId,
	productSlug,
	initialInWishlist,
	isAuthenticated,
}: {
	productId: string
	productSlug: string
	initialInWishlist: boolean
	isAuthenticated: boolean
}) {
	const router = useRouter()
	const [inWishlist, setInWishlist] = useState(initialInWishlist)
	const [pending, startTransition] = useTransition()
	const [popKey, setPopKey] = useState(0)

	function handleClick() {
		if (!isAuthenticated) {
			router.push(`/ingresar?redirect=/producto/${productSlug}` as Route)
			return
		}
		const prev = inWishlist
		setInWishlist(!prev)
		setPopKey((k) => k + 1)
		startTransition(async () => {
			try {
				const r = prev ? await removeFromWishlist(productId) : await addToWishlist(productId)
				// Server is source of truth; reconcile in case prev state was stale.
				if (r.inWishlist !== !prev) setInWishlist(r.inWishlist)
				toast.success(prev ? "Quitada de tu lista" : "¡Agregada a tu lista!")
			} catch {
				setInWishlist(prev) // revert
				toast.error("No se pudo actualizar la lista de deseos")
			}
		})
	}

	return (
		<button
			type="button"
			onClick={handleClick}
			disabled={pending}
			aria-pressed={inWishlist}
			aria-label={inWishlist ? "Quitar de la lista de deseos" : "Agregar a la lista de deseos"}
			className={cn(
				"inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-150 active:scale-95 active:opacity-90 disabled:opacity-60",
				inWishlist
					? "border-velajuy-wine bg-velajuy-pink-soft text-velajuy-wine"
					: "border-velajuy-wine/30 text-velajuy-wine",
			)}
		>
			<Heart
				key={popKey}
				aria-hidden="true"
				className={cn(
					"size-5 transition-colors duration-150",
					inWishlist ? "fill-velajuy-wine text-velajuy-wine animate-pop" : "text-velajuy-wine",
				)}
			/>
			{inWishlist ? "En tu lista" : "Guardar"}
		</button>
	)
}
