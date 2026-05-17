"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { signIn } from "@/lib/auth-client"
import { safeRedirect } from "@/lib/safe-redirect"

export default function AdminIngresarPage() {
	const search = useSearchParams()
	const callbackURL = safeRedirect(search.get("redirect"), "/admin")
	const errorParam = search.get("error")
	const [email, setEmail] = useState("")
	const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle")

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setStatus("loading")
		await signIn.magicLink({ email, callbackURL })
		setStatus("sent")
	}

	return (
		<main className="mx-auto max-w-md px-6 py-24">
			<h1 className="text-3xl font-bold text-velajuy-wine">Ingresar al Admin</h1>
			{errorParam === "unauthorized" && (
				<p className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800">
					Tu cuenta no tiene acceso al admin.
				</p>
			)}
			{status === "sent" ? (
				<p className="mt-6 rounded-xl bg-velajuy-pink-soft p-4 text-velajuy-wine">
					Revisa tu correo y haz clic en el enlace.
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
						Enviar enlace
					</button>
				</form>
			)}
		</main>
	)
}
