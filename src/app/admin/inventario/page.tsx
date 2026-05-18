import { PageHeader } from "@/components/admin/page-header"
import { listStock } from "@/lib/admin/inventory/queries"
import { AdjustRow } from "./adjust-row"

export default async function InventoryPage() {
	const rows = await listStock()
	return (
		<>
			<PageHeader title="Inventario" subtitle={`${rows.length} productos`} />
			<div className="overflow-x-auto rounded-2xl border border-velajuy-wine/10 bg-white">
				<table className="w-full border-collapse">
					<colgroup>
						<col />
						<col className="w-24" />
						<col className="w-28" />
						<col className="w-36" />
						<col className="w-64" />
						<col className="w-28" />
					</colgroup>
					<thead>
						<tr className="border-b border-velajuy-wine/10 text-left text-xs uppercase tracking-wide text-velajuy-wine-soft">
							<th className="px-4 py-2">Producto</th>
							<th className="px-4 py-2 text-right">Stock</th>
							<th className="px-4 py-2">Delta</th>
							<th className="px-4 py-2">Razón</th>
							<th className="px-4 py-2">Nota</th>
							<th className="px-4 py-2 text-right" />
						</tr>
					</thead>
					<tbody className="divide-y divide-velajuy-wine/10">
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
