import Link from "next/link"
import type { Route } from "next"
import type { ReactNode } from "react"
import { PageHeader } from "@/components/admin/page-header"
import { formatCOP } from "@/lib/money"
import { lowStock, pendingShipments, todayOrders, weekRevenue } from "@/lib/admin/dashboard/queries"

export default async function AdminDashboardPage() {
	const [today, weekTotal, low, pending] = await Promise.all([
		todayOrders(),
		weekRevenue(),
		lowStock(),
		pendingShipments(),
	])

	return (
		<>
			<PageHeader title="Dashboard" subtitle="Resumen del día y de la semana" />

			<section className="grid grid-cols-1 gap-4 sm:grid-cols-4">
				<Card label="Pedidos hoy" value={String(today.count)} />
				<Card label="Total hoy" value={formatCOP(today.total)} />
				<Card label="Ingresos semana" value={formatCOP(weekTotal)} />
				<Card label="Stock bajo" value={String(low.filter((p) => p.stock <= p.threshold).length)} />
			</section>

			<section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
				<Panel title="Stock bajo">
					{low.length === 0 ? (
						<p className="text-sm text-velajuy-wine-soft">Todo bien. No hay productos en alerta.</p>
					) : (
						<ul className="divide-y divide-velajuy-wine/10">
							{low.map((p) => (
								<li key={p.id} className="flex items-center justify-between py-2">
									<Link
										href={`/admin/productos/${p.id}` as Route}
										className="text-sm text-velajuy-wine underline"
									>
										{p.name}
									</Link>
									<span
										className={`text-sm font-medium ${
											p.stock <= p.threshold ? "text-red-700" : "text-velajuy-wine-soft"
										}`}
									>
										{p.stock} / umbral {p.threshold}
									</span>
								</li>
							))}
						</ul>
					)}
				</Panel>
				<Panel title="Pendientes de envío">
					{pending.length === 0 ? (
						<p className="text-sm text-velajuy-wine-soft">Sin pedidos en preparación.</p>
					) : (
						<ul className="divide-y divide-velajuy-wine/10">
							{pending.map((o) => (
								<li key={o.id} className="flex items-center justify-between py-2">
									<Link
										href={`/admin/pedidos/${o.orderNumber}` as Route}
										className="text-sm text-velajuy-wine underline"
									>
										{o.orderNumber}
									</Link>
									<span className="text-sm text-velajuy-wine-soft">
										{formatCOP(Number(o.totalAmount))}
									</span>
								</li>
							))}
						</ul>
					)}
				</Panel>
			</section>
		</>
	)
}

function Card({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-2xl border border-velajuy-wine/10 bg-velajuy-cream p-4">
			<p className="text-xs uppercase tracking-wide text-velajuy-wine-soft">{label}</p>
			<p className="mt-1 text-2xl font-bold text-velajuy-wine">{value}</p>
		</div>
	)
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
	return (
		<div className="rounded-2xl border border-velajuy-wine/10 bg-white p-4">
			<h2 className="mb-3 text-lg font-bold text-velajuy-wine">{title}</h2>
			{children}
		</div>
	)
}
