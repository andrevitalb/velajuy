import type { Route } from "next"
import Image from "next/image"
import Link from "next/link"
import { StockBadge } from "./stock-badge"
import { Price } from "./price"
import type { ProductCard as ProductCardData } from "@/lib/catalog/queries"

export function ProductCard({
	product,
	style,
}: {
	product: ProductCardData
	style?: React.CSSProperties
}) {
	const href = `/producto/${product.slug}` as Route
	return (
		<article
			style={style}
			className="group animate-slide-up rounded-2xl bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md"
		>
			<Link href={href} scroll={false} className="block overflow-hidden rounded-xl">
				<div className="relative aspect-square bg-velajuy-pink-soft">
					{product.primaryImageUrl ? (
						<Image
							src={product.primaryImageUrl}
							alt={product.name}
							fill
							loading="lazy"
							sizes="(min-width: 1024px) 22vw, (min-width: 768px) 48vw, 100vw"
							className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
						/>
					) : null}
				</div>
			</Link>
			<div className="mt-3 flex items-start justify-between gap-2">
				<div>
					<Link
						href={href}
						scroll={false}
						className="text-base font-medium leading-tight text-velajuy-wine"
					>
						{product.name}
					</Link>
					<Price
						amount={product.priceAmount}
						currency={product.priceCurrency}
						className="mt-1 block text-sm text-velajuy-wine-soft"
					/>
				</div>
				<StockBadge stock={product.stockQuantity} />
			</div>
		</article>
	)
}
