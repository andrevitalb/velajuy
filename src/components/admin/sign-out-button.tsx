"use client"

import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { signOut } from "@/lib/auth-client"

export function SignOutButton() {
	const router = useRouter()
	return (
		<button
			type="button"
			onClick={async () => {
				await signOut()
				router.push("/admin/ingresar")
			}}
			className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-velajuy-wine hover:bg-velajuy-pink-soft"
		>
			<LogOut className="size-4" /> Salir
		</button>
	)
}
