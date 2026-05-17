"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { signIn } from "@/lib/auth-client"
import { safeRedirect } from "@/lib/safe-redirect"

export default function IngresarPage() {
	const search = useSearchParams()
	const callbackURL = safeRedirect(search.get("redirect"), "/cuenta")
	const [email, setEmail] = useState("")
	const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle")
	const [error, setError] = useState<string | null>(null)

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setStatus("loading")
		setError(null)
		const result = await signIn.magicLink({ email, callbackURL })
		if (result.error) {
			setStatus("error")
			setError(result.error.message ?? "Error al enviar el enlace")
			return
		}
		setStatus("sent")
	}

	return (
		<main className="mx-auto max-w-md px-6 py-24">
			<h1 className="text-3xl font-bold text-velajuy-wine">Ingresar</h1>
			<p className="mt-2 text-velajuy-wine-soft">Te enviamos un enlace mágico a tu correo.</p>

			{status === "sent" ? (
				<p className="mt-6 rounded-xl bg-velajuy-pink-soft p-4 text-velajuy-wine">
					¡Listo! Revisa tu correo y haz clic en el enlace para entrar.
				</p>
			) : (
				<form className="mt-6 space-y-4" onSubmit={handleSubmit}>
					<input type="hidden" name="callbackURL" value={callbackURL} />
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						placeholder="tu@correo.com"
						className="w-full rounded-xl border border-velajuy-wine/20 bg-white px-4 py-3 text-velajuy-wine outline-none focus:border-velajuy-wine"
					/>
					<button
						type="submit"
						disabled={status === "loading"}
						className="w-full rounded-xl bg-velajuy-wine px-4 py-3 font-medium text-white disabled:opacity-60"
					>
						{status === "loading" ? "Enviando…" : "Enviar enlace"}
					</button>
					{error && <p className="text-sm text-red-700">{error}</p>}
				</form>
			)}
		</main>
	)
}
