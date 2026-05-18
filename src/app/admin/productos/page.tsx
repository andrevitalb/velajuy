import Link from "next/link"
import type { Route } from "next"
import Image from "next/image"
import { PageHeader } from "@/components/admin/page-header"
import { DataTable, type Column } from "@/components/admin/data-table"
import { Pagination } from "@/components/admin/pagination"
import { SortableTh } from "@/components/admin/sortable-th"
import { StatusPill } from "@/components/admin/status-pill"
import { formatCOP } from "@/lib/money"
import { listAdminProductsPaginated, type ProductsSortField } from "@/lib/admin/products/queries"

const PER_PAGE = 20
const ALLOWED_SORT: ProductsSortField[] = [
	"name",
	"status",
	"priceAmount",
	"stockQuantity",
	"updatedAt",
]

export default async function ProductsListPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
	const params = await searchParams
	const status =
		params.status === "active" || params.status === "draft" || params.status === "archived"
			? params.status
			: undefined
	const sortRaw = typeof params.sort === "string" ? params.sort : undefined
	const sort = ALLOWED_SORT.includes(sortRaw as ProductsSortField)
		? (sortRaw as ProductsSortField)
		: undefined
	const dir = params.dir === "asc" ? "asc" : "desc"
	const page = Math.max(1, Number(typeof params.page === "string" ? params.page : 1) || 1)

	const { rows, total } = await listAdminProductsPaginated(
		{
			lowStockOnly: params.low === "1",
			status,
		},
		{ sort, dir, page, perPage: PER_PAGE },
	)

	type Row = (typeof rows)[number]

	const columns: Column<Row>[] = [
		{
			header: "Producto",
			headerCell: <SortableTh field="name" label="Producto" />,
			cell: (r) => (
				<div className="flex min-w-0 items-center gap-3">
					{r.primaryImageUrl ? (
						<Image
							src={r.primaryImageUrl}
							alt={r.name}
							width={40}
							height={40}
							className="size-10 shrink-0 rounded-lg object-cover sm:size-12"
						/>
					) : (
						<div className="size-10 shrink-0 rounded-lg bg-velajuy-pink-soft sm:size-12" />
					)}
					<div className="min-w-0">
						<Link
							href={`/admin/productos/${r.id}` as Route}
							className="line-clamp-2 font-medium text-velajuy-wine underline sm:line-clamp-1"
						>
							{r.name}
						</Link>
						<p className="hidden truncate text-xs text-velajuy-wine-soft sm:block">
							{r.skuCode ?? "—"}
						</p>
					</div>
				</div>
			),
		},
		{
			header: "Estado",
			headerCell: <SortableTh field="status" label="Estado" />,
			cell: (r) => <StatusPill status={r.status} />,
		},
		{
			header: "Precio",
			headerCell: <SortableTh field="priceAmount" label="Precio" align="right" />,
			cell: (r) => formatCOP(Number(r.priceAmount)),
			align: "right",
		},
		{
			header: "Stock",
			headerCell: <SortableTh field="stockQuantity" label="Stock" align="right" />,
			cell: (r) => (
				<span className={r.stockQuantity <= r.lowStockThreshold ? "font-medium text-red-700" : ""}>
					{r.stockQuantity}
				</span>
			),
			align: "right",
		},
	]

	return (
		<>
			<PageHeader
				title="Productos"
				subtitle={`${total} resultados`}
				actions={
					<Link
						href={"/admin/productos/nuevo" as Route}
						className="rounded-lg bg-velajuy-wine px-3 py-2 text-sm font-medium text-white"
					>
						Nuevo producto
					</Link>
				}
			/>
			<DataTable
				columns={columns}
				rows={rows}
				rowKey={(r) => r.id}
				emptyLabel="Aún no hay productos. Crea el primero."
				caption="Lista de productos"
			/>
			<Pagination total={total} perPage={PER_PAGE} />
		</>
	)
}
