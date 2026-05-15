import { Price } from "@/components/storefront/price"
import { StockBadge } from "@/components/storefront/stock-badge"

type Attribute = { attrName: string; valueName: string }

export function ProductInfo({
	name,
	priceAmount,
	priceCurrency,
	stockQuantity,
	shortDescription,
	attributes,
	wishlistSlot,
	backInStockSlot,
}: {
	name: string
	priceAmount: number
	priceCurrency: string
	stockQuantity: number
	shortDescription: string | null
	attributes: Attribute[]
	wishlistSlot: React.ReactNode
	backInStockSlot: React.ReactNode
}) {
	const outOfStock = stockQuantity <= 0
	return (
		<section className="space-y-5">
			<header>
				<h1 className="text-3xl font-bold text-velajuy-wine">{name}</h1>
				<div className="mt-2 flex items-center gap-3">
					<Price
						amount={priceAmount}
						currency={priceCurrency}
						className="text-xl text-velajuy-wine-soft"
					/>
					<StockBadge stock={stockQuantity} />
				</div>
			</header>

			{shortDescription ? <p className="text-velajuy-wine-soft">{shortDescription}</p> : null}

			<dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-2xl bg-velajuy-cream p-4 text-sm">
				{attributes.map((a) => (
					<div key={a.attrName} className="flex flex-col">
						<dt className="text-xs uppercase tracking-wide text-velajuy-wine-soft">{a.attrName}</dt>
						<dd className="font-medium text-velajuy-wine">{a.valueName}</dd>
					</div>
				))}
			</dl>

			<div className="flex flex-wrap items-center gap-3">
				<button
					type="button"
					disabled
					className="rounded-xl bg-velajuy-wine px-6 py-3 font-medium text-white disabled:opacity-60"
					title="Próximamente"
				>
					Agregar al carrito
				</button>
				{wishlistSlot}
			</div>

			{outOfStock ? backInStockSlot : null}
		</section>
	)
}
