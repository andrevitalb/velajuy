"use client"

import Image from "next/image"
import { useCallback, useEffect, useState } from "react"
import { cn } from "@/lib/cn"

type Img = { id?: string; url: string; altText?: string | null }

export function ProductGallery({
	images,
	productName,
}: {
	images: Img[]
	productName: string
}) {
	const [active, setActive] = useState(0)
	const move = useCallback(
		(delta: number) =>
			setActive((i) => (images.length === 0 ? 0 : (i + delta + images.length) % images.length)),
		[images.length],
	)
	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === "ArrowRight") move(1)
			if (e.key === "ArrowLeft") move(-1)
		}
		window.addEventListener("keydown", onKey)
		return () => window.removeEventListener("keydown", onKey)
	}, [move])

	if (images.length === 0) {
		return (
			<div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-velajuy-pink-soft" />
		)
	}

	return (
		<div>
			<div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-velajuy-pink-soft">
				{images.map((img, i) => (
					<Image
						key={img.id ?? img.url}
						src={img.url}
						alt={img.altText ?? productName}
						fill
						priority={i === 0}
						sizes="(min-width: 1024px) 50vw, 100vw"
						className={cn(
							"object-cover transition-opacity duration-200 ease-out",
							i === active ? "opacity-100" : "opacity-0",
						)}
					/>
				))}
			</div>
			{images.length > 1 ? (
				<ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
					{images.map((img, i) => (
						<li key={img.id ?? img.url}>
							<button
								type="button"
								aria-label={`Imagen ${i + 1} de ${images.length}`}
								aria-pressed={i === active}
								onClick={() => setActive(i)}
								className={cn(
									"relative h-16 w-16 shrink-0 overflow-hidden rounded-lg transition-all duration-200",
									i === active
										? "ring-2 ring-velajuy-wine ring-offset-2"
										: "ring-1 ring-velajuy-wine/15 opacity-70 hover:opacity-100",
								)}
							>
								<Image
									src={img.url}
									alt=""
									fill
									loading="lazy"
									sizes="64px"
									className="object-cover"
								/>
							</button>
						</li>
					))}
				</ul>
			) : null}
		</div>
	)
}
