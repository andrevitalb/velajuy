const COLORS: Record<string, string> = {
	pending_payment: "bg-amber-100 text-amber-900",
	paid: "bg-emerald-100 text-emerald-900",
	preparing: "bg-sky-100 text-sky-900",
	shipped: "bg-indigo-100 text-indigo-900",
	delivered: "bg-velajuy-pink-soft text-velajuy-wine",
	cancelled: "bg-zinc-200 text-zinc-700",
	failed: "bg-red-100 text-red-900",
}

const LABELS: Record<string, string> = {
	pending_payment: "Pago pendiente",
	paid: "Pagado",
	preparing: "Preparando",
	shipped: "Enviado",
	delivered: "Entregado",
	cancelled: "Cancelado",
	failed: "Falló",
}

export function StatusPill({ status }: { status: string }) {
	const color = COLORS[status] ?? "bg-zinc-100 text-zinc-700"
	const label = LABELS[status] ?? status
	return (
		<span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
			{label}
		</span>
	)
}
