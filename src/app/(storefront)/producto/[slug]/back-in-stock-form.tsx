"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { subscribeBackInStock } from "@/lib/back-in-stock/actions"

export function BackInStockForm({
	productId,
	defaultEmail,
}: {
	productId: string
	defaultEmail?: string | null
}) {
	const [email, setEmail] = useState(defaultEmail ?? "")
	const [pending, startTransition] = useTransition()
	const [done, setDone] = useState(false)

	function onSubmit(e: React.FormEvent) {
		e.preventDefault()
		startTransition(async () => {
			const r = await subscribeBackInStock({ productId, email })
			if (!r.ok) {
				toast.error(r.error)
				return
			}
			setDone(true)
			toast.success("Te avisamos cuando vuelva")
		})
	}

	if (done) {
		return (
			<p className="rounded-xl bg-velajuy-pink-soft p-4 text-sm text-velajuy-wine">
				¡Listo! Te enviaremos un correo en cuanto esta peluca vuelva a estar disponible.
			</p>
		)
	}

	return (
		<form onSubmit={onSubmit} className="rounded-xl bg-velajuy-cream p-4">
			<label className="block text-sm font-medium text-velajuy-wine">Avísame cuando vuelva</label>
			<div className="mt-2 flex gap-2">
				<input
					type="email"
					required
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="tu@correo.com"
					className="flex-1 rounded-lg border border-velajuy-wine/20 bg-white px-3 py-2 text-sm text-velajuy-wine outline-none focus:border-velajuy-wine"
				/>
				<button
					type="submit"
					disabled={pending}
					className="rounded-lg bg-velajuy-wine px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
				>
					{pending ? "Enviando…" : "Avísame"}
				</button>
			</div>
		</form>
	)
}
