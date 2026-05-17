export function EmptyState({
	title,
	description,
	action,
}: {
	title: string
	description?: string
	action?: React.ReactNode
}) {
	return (
		<div className="rounded-2xl border border-dashed border-velajuy-wine/20 bg-velajuy-cream px-6 py-12 text-center">
			<h2 className="text-xl font-semibold text-velajuy-wine">{title}</h2>
			{description ? <p className="mt-2 text-sm text-velajuy-wine-soft">{description}</p> : null}
			{action ? <div className="mt-6">{action}</div> : null}
		</div>
	)
}
