"use client"

import { useState } from "react"

type Tab = { key: string; label: string; body: string }

export function ProductTabs({ tabs }: { tabs: Tab[] }) {
	const [active, setActive] = useState(tabs[0]?.key ?? "descripcion")
	const current = tabs.find((t) => t.key === active) ?? tabs[0]

	return (
		<section className="mt-12">
			<ul className="flex flex-wrap gap-2 border-b border-velajuy-wine/10">
				{tabs.map((t) => (
					<li key={t.key}>
						<button
							type="button"
							onClick={() => setActive(t.key)}
							className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
								active === t.key
									? "border-velajuy-wine text-velajuy-wine"
									: "border-transparent text-velajuy-wine-soft hover:text-velajuy-wine"
							}`}
						>
							{t.label}
						</button>
					</li>
				))}
			</ul>
			<div className="mt-4 whitespace-pre-line text-sm leading-6 text-velajuy-wine-soft">
				{current?.body}
			</div>
		</section>
	)
}
