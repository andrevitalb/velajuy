import { Badge } from "@/components/ui/badge"

export function StockBadge({ stock }: { stock: number }) {
	if (stock <= 0)
		return (
			<Badge tone="danger" srLabel="Agotado">
				Agotado
			</Badge>
		)
	if (stock === 1)
		return (
			<Badge tone="warning" srLabel="Última unidad" pulse>
				Última 1
			</Badge>
		)
	if (stock <= 3)
		return (
			<Badge tone="warning" srLabel="Pocas unidades" pulse>
				{`Últimas ${stock}`}
			</Badge>
		)
	return (
		<Badge tone="success" srLabel="Disponible">
			Disponible
		</Badge>
	)
}
