import Link from "next/link"
import type { Route } from "next"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { PageHeader } from "@/components/admin/page-header"
import { DataTable, type Column } from "@/components/admin/data-table"
import { Pagination } from "@/components/admin/pagination"
import { SortableTh } from "@/components/admin/sortable-th"
import { StatusPill } from "@/components/admin/status-pill"
import { formatCOP } from "@/lib/money"
import {
	listOrdersPaginated,
	type OrdersSortField,
	type OrderListFilters,
} from "@/lib/admin/orders/queries"
import { OrderFilters } from "./filters"

const PER_PAGE = 20
const ALLOWED_SORT: OrdersSortField[] = ["orderNumber", "placedAt", "status", "totalAmount"]
const ALLOWED_STATUSES = new Set<NonNullable<OrderListFilters["status"]>>([
	"pending_payment",
	"paid",
	"preparing",
	"shipped",
	"delivered",
	"cancelled",
	"failed",
])

export default async function OrdersListPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
	const params = await searchParams
	const statusRaw = typeof params.status === "string" ? params.status : undefined
	const status =
		statusRaw && ALLOWED_STATUSES.has(statusRaw as NonNullable<OrderListFilters["status"]>)
			? (statusRaw as NonNullable<OrderListFilters["status"]>)
			: undefined
	const sortRaw = typeof params.sort === "string" ? params.sort : undefined
	const sort = ALLOWED_SORT.includes(sortRaw as OrdersSortField)
		? (sortRaw as OrdersSortField)
		: undefined
	const dir = params.dir === "asc" ? "asc" : "desc"
	const page = Math.max(1, Number(typeof params.page === "string" ? params.page : 1) || 1)

	const { rows, total } = await listOrdersPaginated(
		{
			status,
			codOnly: params.cod === "1",
		},
		{ sort, dir, page, perPage: PER_PAGE },
	)

	type Row = (typeof rows)[number]

	const columns: Column<Row>[] = [
		{
			header: "Pedido",
			headerCell: <SortableTh field="orderNumber" label="Pedido" />,
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
			headerCell: <SortableTh field="placedAt" label="Fecha" />,
			cell: (r) => format(new Date(r.placedAt), "d MMM yyyy HH:mm", { locale: es }),
		},
		{
			header: "Estado",
			headerCell: <SortableTh field="status" label="Estado" />,
			cell: (r) => <StatusPill status={r.status} />,
		},
		{ header: "Pago", cell: (r) => r.paymentMethod ?? "—" },
		{
			header: "Total",
			headerCell: <SortableTh field="totalAmount" label="Total" align="right" />,
			cell: (r) => formatCOP(Number(r.totalAmount)),
			align: "right",
		},
	]

	return (
		<>
			<PageHeader title="Pedidos" subtitle={`${total} resultados`} />
			<OrderFilters />
			<DataTable
				columns={columns}
				rows={rows}
				rowKey={(r) => r.id}
				emptyLabel="No hay pedidos."
				caption="Lista de pedidos"
			/>
			<Pagination total={total} perPage={PER_PAGE} />
		</>
	)
}
