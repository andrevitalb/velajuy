"use client"

import type { Route } from "next"
import { Heart } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { addToWishlist, removeFromWishlist } from "@/lib/wishlist/actions"

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

	function handleClick() {
		if (!isAuthenticated) {
			router.push(`/ingresar?redirect=/producto/${productSlug}` as Route)
			return
		}
		startTransition(async () => {
			if (inWishlist) {
				const r = await removeFromWishlist(productId)
				setInWishlist(r.inWishlist)
				toast.success("Quitada de tu lista")
			} else {
				const r = await addToWishlist(productId)
				setInWishlist(r.inWishlist)
				toast.success("¡Agregada a tu lista!")
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
			className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition disabled:opacity-60 ${
				inWishlist
					? "border-velajuy-wine bg-velajuy-pink-soft text-velajuy-wine"
					: "border-velajuy-wine/30 text-velajuy-wine"
			}`}
		>
			<Heart size={18} fill={inWishlist ? "currentColor" : "none"} />
			{inWishlist ? "En tu lista" : "Guardar"}
		</button>
	)
}
