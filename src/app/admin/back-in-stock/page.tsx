import Link from "next/link"
import type { Route } from "next"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { PageHeader } from "@/components/admin/page-header"
import { listSubscriptionsGroupedByProduct } from "@/lib/admin/back-in-stock/queries"

export default async function BackInStockPage() {
	const rows = await listSubscriptionsGroupedByProduct()
	return (
		<>
			<PageHeader
				title="Suscripciones back-in-stock"
				subtitle={`${rows.length} productos con interés`}
			/>
			<table className="w-full">
				<thead>
					<tr className="text-left text-xs uppercase tracking-wide text-velajuy-wine-soft">
						<th className="py-2">Producto</th>
						<th className="py-2 text-right">Stock</th>
						<th className="py-2 text-right">Pendientes</th>
						<th className="py-2 text-right">Notificados</th>
						<th className="py-2">Última suscripción</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-velajuy-wine/10">
					{rows.map((r) => (
						<tr key={r.productId}>
							<td className="py-3">
								<Link
									href={`/admin/productos/${r.productId}` as Route}
									className="font-medium text-velajuy-wine underline"
								>
									{r.productName}
								</Link>
							</td>
							<td className="py-3 text-right text-sm">{r.stock}</td>
							<td className="py-3 text-right text-sm font-medium text-velajuy-wine">
								{r.pendingCount}
							</td>
							<td className="py-3 text-right text-sm text-velajuy-wine-soft">{r.notifiedCount}</td>
							<td className="py-3 text-sm text-velajuy-wine-soft">
								{format(new Date(r.latest), "d MMM yyyy", { locale: es })}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</>
	)
}
