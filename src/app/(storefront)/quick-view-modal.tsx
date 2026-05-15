"use client"

import Image from "next/image"
import { Modal } from "@/components/ui/modal"
import { Price } from "@/components/storefront/price"
import { StockBadge } from "@/components/storefront/stock-badge"

type Props = {
	name: string
	priceAmount: number
	priceCurrency: string
	stockQuantity: number
	imageUrl: string | null
	shortDescription: string | null
	attributes: Array<{ attrName: string; valueName: string }>
}

export function QuickViewModal(p: Props) {
	return (
		<Modal>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				<div className="relative aspect-square overflow-hidden rounded-xl bg-velajuy-pink-soft">
					{p.imageUrl ? (
						<Image
							src={p.imageUrl}
							alt={p.name}
							fill
							sizes="(min-width: 768px) 50vw, 100vw"
							className="object-cover"
						/>
					) : null}
				</div>
				<div>
					<h2 className="text-2xl font-bold text-velajuy-wine">{p.name}</h2>
					<div className="mt-2 flex items-center gap-3">
						<Price
							amount={p.priceAmount}
							currency={p.priceCurrency}
							className="text-lg text-velajuy-wine-soft"
						/>
						<StockBadge stock={p.stockQuantity} />
					</div>
					{p.shortDescription ? (
						<p className="mt-3 text-sm text-velajuy-wine-soft">{p.shortDescription}</p>
					) : null}
					<dl className="mt-4 space-y-1 text-sm text-velajuy-wine-soft">
						{p.attributes.map((a) => (
							<div key={a.attrName} className="flex gap-2">
								<dt className="font-medium text-velajuy-wine">{a.attrName}:</dt>
								<dd>{a.valueName}</dd>
							</div>
						))}
					</dl>
				</div>
			</div>
		</Modal>
	)
}
