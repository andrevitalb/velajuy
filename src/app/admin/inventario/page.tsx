import { PageHeader } from "@/components/admin/page-header"
import { listStock } from "@/lib/admin/inventory/queries"
import { AdjustRow } from "./adjust-row"

export default async function InventoryPage() {
	const rows = await listStock()
	return (
		<>
			<PageHeader title="Inventario" subtitle={`${rows.length} productos`} />
			<div className="overflow-x-auto rounded-2xl border border-velajuy-wine/10 bg-white">
				<table className="w-full">
					<thead>
						<tr className="text-left text-xs uppercase tracking-wide text-velajuy-wine-soft">
							<th className="px-3 py-2">Producto</th>
							<th className="px-3 py-2">Stock</th>
							<th className="px-3 py-2">Delta</th>
							<th className="px-3 py-2">Razón</th>
							<th className="px-3 py-2">Nota</th>
							<th className="px-3 py-2" />
						</tr>
					</thead>
					<tbody>
						{rows.map((r) => (
							<AdjustRow
								key={r.id}
								productId={r.id}
								name={r.name}
								current={r.stockQuantity}
								threshold={r.lowStockThreshold}
							/>
						))}
					</tbody>
				</table>
			</div>
		</>
	)
}
