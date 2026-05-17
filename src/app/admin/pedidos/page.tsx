import Link from "next/link"
import type { Route } from "next"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { PageHeader } from "@/components/admin/page-header"
import { DataTable, type Column } from "@/components/admin/data-table"
import { StatusPill } from "@/components/admin/status-pill"
import { formatCOP } from "@/lib/money"
import { listOrders } from "@/lib/admin/orders/queries"
import { OrderFilters } from "./filters"

type Order = Awaited<ReturnType<typeof listOrders>>[number]

export default async function OrdersListPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
	const params = await searchParams
	const rows = await listOrders({
		status: typeof params.status === "string" ? (params.status as Order["status"]) : undefined,
		codOnly: params.cod === "1",
	})

	const columns: Column<Order>[] = [
		{
			header: "Pedido",
			cell: (r) => (
				<Link
					href={`/admin/pedidos/${r.orderNumber}` as Route}
					className="font-medium text-velajuy-wine underline"
				>
					{r.orderNumber}
				</Link>
			),
		},
		{
			header: "Fecha",
			cell: (r) => format(new Date(r.placedAt), "d MMM yyyy HH:mm", { locale: es }),
		},
		{ header: "Estado", cell: (r) => <StatusPill status={r.status} /> },
		{ header: "Pago", cell: (r) => r.paymentMethod ?? "—" },
		{ header: "Total", cell: (r) => formatCOP(Number(r.totalAmount)), align: "right" },
	]

	return (
		<>
			<PageHeader title="Pedidos" subtitle={`${rows.length} resultados`} />
			<OrderFilters />
			<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} emptyLabel="No hay pedidos." />
		</>
	)
}
