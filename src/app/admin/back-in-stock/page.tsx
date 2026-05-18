import Link from "next/link"
import type { Route } from "next"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { PageHeader } from "@/components/admin/page-header"
import { DataTable, type Column } from "@/components/admin/data-table"
import { listSubscriptionsGroupedByProduct } from "@/lib/admin/back-in-stock/queries"

export default async function BackInStockPage() {
	const rows = await listSubscriptionsGroupedByProduct()
	type Row = (typeof rows)[number]

	const columns: Column<Row>[] = [
		{
			header: "Producto",
			cell: (r) => (
				<Link
					href={`/admin/productos/${r.productId}` as Route}
					className="font-medium text-velajuy-wine underline"
				>
					{r.productName}
				</Link>
			),
		},
		{ header: "Stock", cell: (r) => r.stock, align: "right" },
		{
			header: "Pendientes",
			cell: (r) => <span className="font-medium text-velajuy-wine">{r.pendingCount}</span>,
			align: "right",
		},
		{
			header: "Notificados",
			cell: (r) => <span className="text-velajuy-wine-soft">{r.notifiedCount}</span>,
			align: "right",
		},
		{
			header: "Última suscripción",
			cell: (r) => (
				<span className="text-velajuy-wine-soft">
					{format(new Date(r.latest), "d MMM yyyy", { locale: es })}
				</span>
			),
		},
	]

	return (
		<>
			<PageHeader
				title="Suscripciones back-in-stock"
				subtitle={`${rows.length} productos con interés`}
			/>
			<DataTable
				columns={columns}
				rows={rows}
				rowKey={(r) => r.productId}
				emptyLabel="Sin suscripciones."
				caption="Suscripciones back-in-stock por producto"
			/>
		</>
	)
}
