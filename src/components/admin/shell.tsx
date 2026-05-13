import { AdminSidebar } from "./sidebar"

export function AdminShell({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-h-screen bg-white">
			<AdminSidebar />
			<main className="flex-1 p-8">{children}</main>
		</div>
	)
}
