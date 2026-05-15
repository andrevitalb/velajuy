import type { Route } from "next"
import Link from "next/link"
import { unsubscribeBackInStock } from "@/lib/back-in-stock/actions"

export default async function UnsubscribePage({
	searchParams,
}: {
	searchParams: Promise<{ token?: string }>
}) {
	const { token } = await searchParams
	const result = token
		? await unsubscribeBackInStock(token)
		: { ok: false as const, error: "Token requerido" }

	return (
		<main className="mx-auto max-w-md px-6 py-24 text-center">
			<h1 className="text-2xl font-bold text-velajuy-wine">Desuscripción</h1>
			{result.ok ? (
				<p className="mt-4 text-velajuy-wine-soft">
					Ya no recibirás correos cuando esta peluca vuelva.
				</p>
			) : (
				<p className="mt-4 text-velajuy-wine-soft">
					No pudimos procesar tu solicitud: {result.error}.
				</p>
			)}
			<Link
				href={"/" as Route}
				className="mt-6 inline-block rounded-xl bg-velajuy-wine px-5 py-2.5 text-sm font-medium text-white"
			>
				Volver a Velajuy
			</Link>
		</main>
	)
}
