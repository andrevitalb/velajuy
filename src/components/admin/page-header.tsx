import Link from "next/link"
import type { Route } from "next"

export type Crumb = { href: Route; label: string }

export function PageHeader({
	title,
	subtitle,
	actions,
	breadcrumb,
}: {
	title: string
	subtitle?: string
	actions?: React.ReactNode
	breadcrumb?: Crumb[]
}) {
	return (
		<header className="mb-8 flex items-start justify-between gap-4">
			<div className="min-w-0">
				{breadcrumb && breadcrumb.length > 0 && (
					<nav
						aria-label="Migas de pan"
						className="mb-2 flex flex-wrap items-center gap-1 text-sm text-velajuy-wine-soft"
					>
						{breadcrumb.map((c, idx) => {
							const isLast = idx === breadcrumb.length - 1
							return (
								<span key={`${c.href}-${idx}`} className="flex items-center gap-1">
									{isLast ? (
										<span
											aria-current="page"
											className="font-medium text-velajuy-wine"
										>
											{c.label}
										</span>
									) : (
										<Link
											href={c.href}
											className="underline transition-colors duration-150 hover:text-velajuy-wine"
										>
											{c.label}
										</Link>
									)}
									{!isLast && <span aria-hidden="true">/</span>}
								</span>
							)
						})}
					</nav>
				)}
				<h1 className="text-3xl font-bold text-velajuy-wine">{title}</h1>
				{subtitle && <p className="mt-1 text-sm text-velajuy-wine-soft">{subtitle}</p>}
			</div>
			{actions && <div className="flex gap-2">{actions}</div>}
		</header>
	)
}
