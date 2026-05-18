import Link from "next/link"
import type { Route } from "next"
import { requireAdmin } from "@/lib/auth-guards"
import { AdminSidebar } from "./sidebar"
import { MobileNav } from "./mobile-nav"
import { SignOutButton } from "./sign-out-button"

export async function AdminShell({ children }: { children: React.ReactNode }) {
	const session = await requireAdmin()
	const role = session.role
	const name = session.user.name ?? session.user.email

	return (
		<div className="flex min-h-screen bg-white">
			<AdminSidebar role={role} />
			<div className="flex flex-1 flex-col">
				<header className="flex items-center justify-between gap-4 border-b border-velajuy-wine/10 bg-velajuy-cream px-4 py-3 md:hidden print:hidden">
					<div className="flex items-center gap-2">
						<MobileNav role={role} />
						<Link
							href={"/admin" as Route}
							className="text-base font-bold text-velajuy-wine"
						>
							Velajuy · Admin
						</Link>
					</div>
					<SignOutButton />
				</header>
				<header className="hidden items-center justify-end gap-4 border-b border-velajuy-wine/10 bg-velajuy-cream px-6 py-3 md:flex print:hidden">
					<span className="text-sm text-velajuy-wine">
						{name}
						<span className="ml-2 rounded-full bg-velajuy-pink-soft px-2 py-0.5 text-xs font-medium uppercase tracking-wide">
							{role}
						</span>
					</span>
					<SignOutButton />
				</header>
				<main id="main" tabIndex={-1} className="flex-1 p-4 outline-none md:p-8">
					{children}
				</main>
			</div>
		</div>
	)
}
