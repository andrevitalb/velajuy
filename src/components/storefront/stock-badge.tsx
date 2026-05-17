export function StockBadge({ stock }: { stock: number }) {
	if (stock <= 0) {
		return (
			<span className="inline-flex items-center rounded-full bg-velajuy-wine/10 px-3 py-1 text-xs font-medium text-velajuy-wine">
				Agotado
			</span>
		)
	}
	if (stock <= 2) {
		return (
			<span className="inline-flex items-center rounded-full bg-velajuy-pink-soft px-3 py-1 text-xs font-medium text-velajuy-wine">
				Últimas {stock}
			</span>
		)
	}
	return (
		<span className="inline-flex items-center rounded-full bg-velajuy-pink-soft px-3 py-1 text-xs font-medium text-velajuy-wine">
			Disponible
		</span>
	)
}
