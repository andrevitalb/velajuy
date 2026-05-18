"use client"

import { useState } from "react"
import { cn } from "@/lib/cn"

type Tab = { key: string; label: string; body: string }

export function ProductTabs({ tabs }: { tabs: Tab[] }) {
	const [active, setActive] = useState(tabs[0]?.key ?? "")

	function onKey(e: React.KeyboardEvent<HTMLButtonElement>, idx: number) {
		if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
		e.preventDefault()
		const next =
			e.key === "ArrowRight" ? (idx + 1) % tabs.length : (idx - 1 + tabs.length) % tabs.length
		setActive(tabs[next].key)
		;(e.currentTarget.parentElement?.children[next] as HTMLButtonElement | undefined)?.focus()
	}

	return (
		<section className="mt-12">
			<div
				role="tablist"
				aria-label="Detalles del producto"
				className="flex flex-wrap gap-1 border-b border-velajuy-wine/10"
			>
				{tabs.map((t, i) => {
					const selected = active === t.key
					return (
						<button
							key={t.key}
							type="button"
							role="tab"
							id={`tab-${t.key}`}
							aria-selected={selected}
							aria-controls={`panel-${t.key}`}
							tabIndex={selected ? 0 : -1}
							onClick={() => setActive(t.key)}
							onKeyDown={(e) => onKey(e, i)}
							className={cn(
								"-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-95 active:opacity-90",
								selected
									? "border-velajuy-wine text-velajuy-wine"
									: "border-transparent text-velajuy-wine-soft hover:text-velajuy-wine",
							)}
						>
							{t.label}
						</button>
					)
				})}
			</div>
			{tabs.map((t) => (
				<div
					key={t.key}
					role="tabpanel"
					id={`panel-${t.key}`}
					aria-labelledby={`tab-${t.key}`}
					hidden={active !== t.key}
					className="mt-4 max-w-2xl whitespace-pre-line text-sm leading-6 text-velajuy-wine-soft animate-fade-in"
				>
					{t.body}
				</div>
			))}
		</section>
	)
}
