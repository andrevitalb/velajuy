export function PageHeader({
	title,
	subtitle,
	actions,
}: {
	title: string
	subtitle?: string
	actions?: React.ReactNode
}) {
	return (
		<header className="mb-8 flex items-start justify-between gap-4">
			<div>
				<h1 className="text-3xl font-bold text-velajuy-wine">{title}</h1>
				{subtitle && <p className="mt-1 text-sm text-velajuy-wine-soft">{subtitle}</p>}
			</div>
			{actions && <div className="flex gap-2">{actions}</div>}
		</header>
	)
}
