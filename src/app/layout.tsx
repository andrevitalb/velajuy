import type { Metadata } from "next"
import { Toaster } from "sonner"
import { SkipLink } from "@/components/storefront/skip-link"
import "./globals.css"

export const metadata: Metadata = {
	title: "Velajuy Pelucas",
	description: "Pelucas en Colombia — Velajuy",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="es-CO">
			<body className="bg-velajuy-pink-soft text-velajuy-wine antialiased">
				<SkipLink />
				{children}
				<Toaster
					richColors
					position="top-center"
					duration={4000}
					toastOptions={{
						classNames: {
							toast: "rounded-xl border border-velajuy-wine/10",
							title: "text-sm font-medium",
							description: "text-xs opacity-80",
						},
					}}
				/>
			</body>
		</html>
	)
}
