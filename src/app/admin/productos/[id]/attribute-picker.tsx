"use client"

import { useState } from "react"

type Attribute = {
	id: string
	name: string
	values: { id: string; name: string }[]
}

export function AttributePicker({
	attributes,
	value,
	onChange,
}: {
	attributes: Attribute[]
	value: string[]
	onChange: (next: string[]) => void
}) {
	const [selected, setSelected] = useState<Set<string>>(new Set(value))

	function toggle(id: string) {
		const next = new Set(selected)
		if (next.has(id)) next.delete(id)
		else next.add(id)
		setSelected(next)
		onChange(Array.from(next))
	}

	return (
		<div className="space-y-4">
			{attributes.map((attr) => (
				<div key={attr.id}>
					<p className="mb-2 text-sm font-medium text-velajuy-wine">{attr.name}</p>
					<div className="flex flex-wrap gap-2">
						{attr.values.map((v) => {
							const isActive = selected.has(v.id)
							return (
								<button
									key={v.id}
									type="button"
									onClick={() => toggle(v.id)}
									className={`rounded-full border px-3 py-1 text-sm ${
										isActive
											? "border-velajuy-wine bg-velajuy-wine text-white"
											: "border-velajuy-wine/20 text-velajuy-wine hover:bg-velajuy-pink-soft"
									}`}
								>
									{v.name}
								</button>
							)
						})}
					</div>
				</div>
			))}
		</div>
	)
}
