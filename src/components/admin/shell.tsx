import { requireAdmin } from "@/lib/auth-guards"
import { AdminSidebar } from "./sidebar"
import { SignOutButton } from "./sign-out-button"

export async function AdminShell({ children }: { children: React.ReactNode }) {
	const session = await requireAdmin()
	const role = session.role
	const name = session.user.name ?? session.user.email

	return (
		<div className="flex min-h-screen bg-white">
			<AdminSidebar role={role} />
			<div className="flex flex-1 flex-col">
				<header className="flex items-center justify-end gap-4 border-b border-velajuy-wine/10 bg-velajuy-cream px-6 py-3 print:hidden">
					<span className="text-sm text-velajuy-wine">
						{name}
						<span className="ml-2 rounded-full bg-velajuy-pink-soft px-2 py-0.5 text-xs font-medium uppercase tracking-wide">
							{role}
						</span>
					</span>
					<SignOutButton />
				</header>
				<main className="flex-1 p-8">{children}</main>
			</div>
		</div>
	)
}
