"use client"

import { Menu } from "lucide-react"
import { useState } from "react"
import { Sheet } from "@/components/ui/sheet"
import { AdminNavList, type AdminRole } from "./sidebar"

export function MobileNav({ role }: { role: AdminRole }) {
	const [open, setOpen] = useState(false)
	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				aria-label="Abrir menú"
				aria-expanded={open}
				className="inline-flex size-11 items-center justify-center rounded-lg text-velajuy-wine transition-all duration-150 hover:bg-velajuy-pink-soft active:scale-95"
			>
				<Menu className="size-5" aria-hidden="true" />
			</button>
			<Sheet open={open} onClose={() => setOpen(false)} title="Navegación">
				<AdminNavList role={role} onNavigate={() => setOpen(false)} />
			</Sheet>
		</>
	)
}
