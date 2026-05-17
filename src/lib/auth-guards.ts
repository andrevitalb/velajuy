import type { Route } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

type AdminRole = "staff" | "owner"

export type AuthenticatedSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>

/** Returns the session or redirects to `/ingresar` with the current path as `redirect`. */
export async function requireSession(returnTo?: string): Promise<AuthenticatedSession> {
	const requestHeaders = await headers()
	const session = await auth.api.getSession({ headers: requestHeaders })
	if (!session) {
		const target = returnTo ?? requestHeaders.get("x-pathname") ?? "/cuenta"
		redirect(`/ingresar?redirect=${encodeURIComponent(target)}` as Route)
	}
	return session
}

/** Returns the session if the user has admin role; otherwise redirects to `/admin/ingresar`. */
export async function requireAdmin(): Promise<AuthenticatedSession & { role: AdminRole }> {
	const requestHeaders = await headers()
	const session = await auth.api.getSession({ headers: requestHeaders })
	if (!session) redirect("/admin/ingresar" as Route)

	const role = (session.user as { role?: string }).role
	if (role !== "staff" && role !== "owner") {
		redirect("/admin/ingresar?error=unauthorized" as Route)
	}
	return { ...session, role: role as AdminRole }
}
