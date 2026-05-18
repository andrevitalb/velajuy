"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Route } from "next"
import { useState } from "react"
import { LogOut, Settings } from "lucide-react"
import { signOut } from "@/lib/auth-client"
import { Sheet } from "@/components/ui/sheet"
import { cn } from "@/lib/cn"
import type { AdminRole } from "./sidebar"

function getInitials(name: string | null | undefined, email: string): string {
	const source = (name?.trim() || email).trim()
	const parts = source.split(/\s+/).slice(0, 2)
	const letters = parts.map((p) => p[0]).join("")
	return letters.toUpperCase() || "?"
}

export function AdminUserMenu({
	name,
	email,
	role,
}: {
	name: string | null
	email: string
	role: AdminRole
}) {
	const router = useRouter()
	const [open, setOpen] = useState(false)
	const initials = getInitials(name, email)
	const displayName = name?.trim() || email

	async function handleSignOut() {
		setOpen(false)
		await signOut()
		router.push("/admin/ingresar")
	}

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				aria-haspopup="dialog"
				aria-expanded={open}
				aria-label={`Cuenta de ${displayName}`}
				className="inline-flex size-10 items-center justify-center rounded-full bg-velajuy-wine text-sm font-semibold text-velajuy-cream transition-all duration-150 hover:opacity-90 active:scale-95"
			>
				<span aria-hidden="true">{initials}</span>
			</button>
			<Sheet open={open} onClose={() => setOpen(false)} title="Mi cuenta">
				<div className="flex items-center gap-3 rounded-xl bg-white p-4">
					<span
						aria-hidden="true"
						className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-velajuy-wine text-base font-semibold text-velajuy-cream"
					>
						{initials}
					</span>
					<div className="min-w-0">
						<p className="truncate text-sm font-semibold text-velajuy-wine">{displayName}</p>
						{name && <p className="truncate text-xs text-velajuy-wine-soft">{email}</p>}
						<p className="mt-1 inline-flex rounded-full bg-velajuy-pink-soft px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-velajuy-wine">
							{role}
						</p>
					</div>
				</div>
				<ul className="mt-4 space-y-1">
					{role === "owner" && (
						<li>
							<Link
								href={"/admin/configuracion" as Route}
								onClick={() => setOpen(false)}
								className={cn(
									"flex h-12 items-center gap-3 rounded-lg px-3 text-sm transition-colors duration-150",
									"text-velajuy-wine hover:bg-velajuy-pink-soft",
								)}
							>
								<Settings className="size-5 shrink-0" aria-hidden="true" />
								Configuración
							</Link>
						</li>
					)}
					<li className="pt-2">
						<button
							type="button"
							onClick={handleSignOut}
							className="flex h-12 w-full items-center gap-3 rounded-lg border border-velajuy-wine/15 px-3 text-sm text-velajuy-wine transition-all duration-150 hover:bg-velajuy-pink-soft active:scale-[0.98]"
						>
							<LogOut className="size-5 shrink-0" aria-hidden="true" />
							Cerrar sesión
						</button>
					</li>
				</ul>
			</Sheet>
		</>
	)
}
