import { StorefrontFooter } from "@/components/storefront/footer"
import { StorefrontHeader } from "@/components/storefront/header"

export default function StorefrontLayout({
	children,
	modal,
}: {
	children: React.ReactNode
	modal: React.ReactNode
}) {
	return (
		<div className="flex min-h-screen flex-col">
			<StorefrontHeader />
			<main id="main" tabIndex={-1} className="flex-1 outline-none">
				{children}
			</main>
			<StorefrontFooter />
			{modal}
		</div>
	)
}
