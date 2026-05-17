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
		<div className="mx-auto max-w-md animate-fade-in rounded-2xl border-2 border-dashed border-velajuy-wine/20 p-8 text-center">
			<h2 className="text-lg font-semibold text-velajuy-wine">{title}</h2>
			{description && <p className="mt-2 text-sm text-velajuy-wine-soft">{description}</p>}
			{action && <div className="mt-6">{action}</div>}
		</div>
	)
}
