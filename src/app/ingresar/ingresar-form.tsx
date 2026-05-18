"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { signIn } from "@/lib/auth-client"
import { safeRedirect } from "@/lib/safe-redirect"
import { Button } from "@/components/ui/button"

export function IngresarForm() {
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
				<div
					role="status"
					aria-live="polite"
					className="mt-6 rounded-xl bg-velajuy-pink-soft p-4 text-velajuy-wine"
				>
					¡Listo! Revisa tu correo y haz clic en el enlace para entrar.
				</div>
			) : (
				<form className="mt-6 space-y-4" onSubmit={handleSubmit}>
					<input type="hidden" name="callbackURL" value={callbackURL} />
					<div>
						<label
							htmlFor="login-email"
							className="mb-1 block text-sm font-medium text-velajuy-wine"
						>
							Tu correo
						</label>
						<input
							id="login-email"
							type="email"
							name="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							autoComplete="email"
							placeholder="tu@correo.com"
							aria-invalid={error ? true : undefined}
							aria-describedby={error ? "login-email-error" : undefined}
							className="w-full rounded-xl border border-velajuy-wine/20 bg-white px-4 py-3 text-velajuy-wine outline-none transition-colors duration-200 focus:border-velajuy-wine"
						/>
						{error && (
							<p id="login-email-error" role="alert" className="mt-2 text-sm text-rose-700">
								{error}
							</p>
						)}
					</div>
					<Button
						type="submit"
						size="lg"
						pending={status === "loading"}
						className="w-full"
					>
						{status === "loading" ? "Enviando…" : "Enviar enlace"}
					</Button>
				</form>
			)}
		</main>
	)
}
