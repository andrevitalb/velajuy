import type { Route } from "next"
import Link from "next/link"
import { requireSession } from "@/lib/auth-guards"

export default async function CuentaPage() {
	const session = await requireSession("/cuenta")
	return (
		<main className="mx-auto max-w-3xl px-6 py-24">
			<h1 className="text-3xl font-bold text-velajuy-wine">
				Hola, {session.user.name ?? session.user.email}
			</h1>
			<nav className="mt-6 flex gap-4 text-velajuy-wine underline">
				<Link href={"/cuenta/wishlist" as Route}>Mi lista de deseos</Link>
			</nav>
		</main>
	)
}
