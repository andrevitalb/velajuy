import Link from "next/link"
import type { Route } from "next"
import Image from "next/image"
import { PageHeader } from "@/components/admin/page-header"
import { DataTable, type Column } from "@/components/admin/data-table"
import { StatusPill } from "@/components/admin/status-pill"
import { formatCOP } from "@/lib/money"
import { listAdminProducts } from "@/lib/admin/products/queries"

type Row = Awaited<ReturnType<typeof listAdminProducts>>[number]

export default async function ProductsListPage({
	searchParams,
}: {
	searchParams: Promise<{ low?: string; status?: string }>
}) {
	const params = await searchParams
	const rows = await listAdminProducts({
		lowStockOnly: params.low === "1",
		status:
			params.status === "active" || params.status === "draft" || params.status === "archived"
				? params.status
				: undefined,
	})

	const columns: Column<Row>[] = [
		{
			header: "Producto",
			cell: (r) => (
				<div className="flex items-center gap-3">
					{r.primaryImageUrl ? (
						<Image
							src={r.primaryImageUrl}
							alt={r.name}
							width={48}
							height={48}
							className="rounded-lg object-cover"
						/>
					) : (
						<div className="size-12 rounded-lg bg-velajuy-pink-soft" />
					)}
					<div>
						<Link
							href={`/admin/productos/${r.id}` as Route}
							className="font-medium text-velajuy-wine underline"
						>
							{r.name}
						</Link>
						<p className="text-xs text-velajuy-wine-soft">{r.skuCode ?? "—"}</p>
					</div>
				</div>
			),
		},
		{ header: "Estado", cell: (r) => <StatusPill status={r.status} /> },
		{
			header: "Precio",
			cell: (r) => formatCOP(Number(r.priceAmount)),
			align: "right",
		},
		{
			header: "Stock",
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
			/>
		</>
	)
}
