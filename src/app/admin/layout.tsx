import { headers } from "next/headers"
import { AdminShell } from "@/components/admin/shell"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	const pathname = (await headers()).get("x-pathname") ?? ""

	if (pathname.startsWith("/admin/ingresar")) {
		return <>{children}</>
	}

	return <AdminShell>{children}</AdminShell>
}
