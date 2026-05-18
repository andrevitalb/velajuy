import type { ReactNode } from "react"

export function Field({
	label,
	required,
	error,
	htmlFor,
	helper,
	children,
}: {
	label: string
	required?: boolean
	error?: string
	htmlFor: string
	helper?: string
	children: ReactNode
}) {
	return (
		<div>
			<label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-velajuy-wine">
				{label}{" "}
				{required && (
					<span aria-hidden="true" className="text-rose-700">
						*
					</span>
				)}
			</label>
			{children}
			{helper && !error && <p className="mt-1 text-xs text-velajuy-wine-soft">{helper}</p>}
			{error && (
				<p id={`${htmlFor}-error`} role="alert" className="mt-1 text-xs text-rose-700">
					{error}
				</p>
			)}
		</div>
	)
}
