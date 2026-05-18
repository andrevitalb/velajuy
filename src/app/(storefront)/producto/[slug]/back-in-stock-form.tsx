"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { subscribeBackInStock } from "@/lib/back-in-stock/actions"
import { Button } from "@/components/ui/button"

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
	const [error, setError] = useState<string | null>(null)

	function onSubmit(e: React.FormEvent) {
		e.preventDefault()
		setError(null)
		startTransition(async () => {
			const r = await subscribeBackInStock({ productId, email })
			if (!r.ok) {
				setError(r.error)
				toast.error(r.error)
				return
			}
			setDone(true)
			toast.success("Te avisamos cuando vuelva")
		})
	}

	if (done) {
		return (
			<div
				role="status"
				aria-live="polite"
				className="animate-slide-up space-y-2 rounded-xl bg-velajuy-pink-soft p-4 text-sm text-velajuy-wine"
			>
				<p>¡Listo! Te enviaremos un correo en cuanto esta peluca vuelva a estar disponible.</p>
				<button
					type="button"
					onClick={() => setDone(false)}
					className="text-sm underline transition-all duration-150 active:scale-95 active:opacity-90"
				>
					Usar otro correo
				</button>
			</div>
		)
	}

	return (
		<form onSubmit={onSubmit} className="rounded-xl bg-velajuy-cream p-4">
			<label htmlFor="back-in-stock-email" className="block text-sm font-medium text-velajuy-wine">
				Avísame cuando vuelva
			</label>
			<div className="mt-2 flex gap-2">
				<input
					id="back-in-stock-email"
					type="email"
					required
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					autoComplete="email"
					inputMode="email"
					placeholder="tu@correo.com"
					aria-invalid={error ? true : undefined}
					aria-describedby={error ? "back-in-stock-email-error" : undefined}
					className="flex-1 rounded-lg border border-velajuy-wine/20 bg-white px-3 py-2 text-sm text-velajuy-wine outline-none transition-colors duration-200 focus:border-velajuy-wine"
				/>
				<Button type="submit" size="sm" pending={pending}>
					{pending ? "Enviando…" : "Avísame"}
				</Button>
			</div>
			{error && (
				<p id="back-in-stock-email-error" role="alert" className="mt-2 text-sm text-rose-700">
					{error}
				</p>
			)}
		</form>
	)
}
