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

/** Returns the session if the user has owner role; otherwise redirects. */
export async function requireOwner(): Promise<AuthenticatedSession & { role: "owner" }> {
	const requestHeaders = await headers()
	const session = await auth.api.getSession({ headers: requestHeaders })
	if (!session) redirect("/admin/ingresar" as Route)
	const role = (session.user as { role?: string }).role
	if (role !== "owner") redirect("/admin?error=forbidden" as Route)
	return { ...session, role: "owner" }
}

/** Non-throwing role lookup for conditional UI. Returns "owner" | "staff" | null. */
export async function getAdminRole(): Promise<"owner" | "staff" | null> {
	const requestHeaders = await headers()
	const session = await auth.api.getSession({ headers: requestHeaders })
	if (!session) return null
	const role = (session.user as { role?: string }).role
	if (role === "owner" || role === "staff") return role
	return null
}
