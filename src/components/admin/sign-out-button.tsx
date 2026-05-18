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
			className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-velajuy-wine transition-all duration-150 hover:bg-velajuy-pink-soft active:scale-95 active:opacity-90"
		>
			<LogOut className="size-4" /> Salir
		</button>
	)
}
