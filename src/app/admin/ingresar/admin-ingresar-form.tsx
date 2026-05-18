"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { signIn } from "@/lib/auth-client"
import { safeRedirect } from "@/lib/safe-redirect"
import { Button } from "@/components/ui/button"

export function AdminIngresarForm() {
	const search = useSearchParams()
	const callbackURL = safeRedirect(search.get("redirect"), "/admin")
	const errorParam = search.get("error")
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
	const [error, setError] = useState<string | null>(null)

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setStatus("loading")
		setError(null)
		try {
			const result = await signIn.email({ email, password, callbackURL })
			if (result.error) {
				setStatus("error")
				setError("Correo o contraseña incorrectos")
				return
			}
			// success: better-auth redirects via callbackURL; the page navigates away
		} catch (err) {
			setStatus("error")
			setError(err instanceof Error ? err.message : "Error al iniciar sesión")
		} finally {
			setStatus((prev) => (prev === "loading" ? "idle" : prev))
		}
	}

	return (
		<main className="mx-auto max-w-md px-6 py-24">
			<h1 className="text-3xl font-bold text-velajuy-wine">Ingresar al Admin</h1>
			{errorParam === "unauthorized" && (
				<p className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800">
					Tu cuenta no tiene acceso al admin.
				</p>
			)}
			<form className="mt-6 space-y-4" onSubmit={handleSubmit}>
				<input type="hidden" name="callbackURL" value={callbackURL} />
				<label className="block text-sm text-velajuy-wine">
					<span className="mb-1 block font-medium">Correo</span>
					<input
						type="email"
						autoComplete="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						className="w-full rounded-xl border border-velajuy-wine/20 bg-white px-4 py-3 text-velajuy-wine outline-none focus:border-velajuy-wine"
					/>
				</label>
				<label className="block text-sm text-velajuy-wine">
					<span className="mb-1 block font-medium">Contraseña</span>
					<input
						type="password"
						autoComplete="current-password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						minLength={8}
						className="w-full rounded-xl border border-velajuy-wine/20 bg-white px-4 py-3 text-velajuy-wine outline-none focus:border-velajuy-wine"
					/>
				</label>
				{error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
				<Button type="submit" size="lg" pending={status === "loading"} className="w-full">
					{status === "loading" ? "Entrando..." : "Entrar"}
				</Button>
			</form>
			<p className="mt-4 text-center text-sm text-velajuy-wine/60">
				Si olvidaste tu contraseña, contacta al owner.
			</p>
		</main>
	)
}
