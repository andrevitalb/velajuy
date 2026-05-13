import type { Route } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function CuentaPage() {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session) redirect("/ingresar" as Route)

	return (
		<main className="mx-auto max-w-3xl px-6 py-24">
			<h1 className="text-3xl font-bold text-velajuy-wine">
				Hola, {session.user.name ?? session.user.email}
			</h1>
			<p className="mt-2 text-velajuy-wine-soft">Tu cuenta — próximamente.</p>
		</main>
	)
}
