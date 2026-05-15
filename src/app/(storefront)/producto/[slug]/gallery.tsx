"use client"

import Image from "next/image"
import { useState } from "react"

type Img = { id: string; url: string; altText: string | null }

export function ProductGallery({ images, productName }: { images: Img[]; productName: string }) {
	const [active, setActive] = useState(0)
	const current = images[active] ?? images[0]

	return (
		<div className="space-y-3">
			<div className="relative aspect-square overflow-hidden rounded-2xl bg-velajuy-pink-soft">
				{current ? (
					<Image
						src={current.url}
						alt={current.altText ?? productName}
						fill
						sizes="(min-width: 1024px) 50vw, 100vw"
						className="object-cover"
						priority
					/>
				) : null}
			</div>
			{images.length > 1 ? (
				<ul className="flex gap-2">
					{images.map((img, i) => (
						<li key={img.id}>
							<button
								type="button"
								onClick={() => setActive(i)}
								aria-label={`Imagen ${i + 1}`}
								className={`relative h-16 w-16 overflow-hidden rounded-lg ${
									i === active ? "ring-2 ring-velajuy-wine" : "ring-1 ring-velajuy-wine/10"
								}`}
							>
								<Image
									src={img.url}
									alt={img.altText ?? productName}
									fill
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
