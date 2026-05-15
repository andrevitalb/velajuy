import { StorefrontFooter } from "@/components/storefront/footer"
import { StorefrontHeader } from "@/components/storefront/header"

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-h-screen flex-col">
			<StorefrontHeader />
			<div className="flex-1">{children}</div>
			<StorefrontFooter />
		</div>
	)
}
