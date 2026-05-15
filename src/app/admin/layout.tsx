import type { Route } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { AdminShell } from "@/components/admin/shell"
import { auth } from "@/lib/auth"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	const requestHeaders = await headers()
	const pathname = requestHeaders.get("x-pathname") ?? ""

	if (pathname.startsWith("/admin/ingresar")) {
		return <>{children}</>
	}

	const session = await auth.api.getSession({ headers: requestHeaders })
	if (!session) redirect("/admin/ingresar" as Route)

	const role = (session.user as { role?: string }).role
	if (role !== "staff" && role !== "owner") {
		redirect("/admin/ingresar?error=unauthorized" as Route)
	}

	return <AdminShell>{children}</AdminShell>
}
