import { Badge, type BadgeTone } from "@/components/ui/badge"

const TONE: Record<string, BadgeTone> = {
	pending_payment: "warning",
	paid: "success",
	preparing: "info",
	shipped: "info",
	delivered: "success",
	cancelled: "neutral",
	failed: "danger",
}

const LABEL: Record<string, string> = {
	pending_payment: "Pago pendiente",
	paid: "Pagado",
	preparing: "Preparando",
	shipped: "Enviado",
	delivered: "Entregado",
	cancelled: "Cancelado",
	failed: "Falló",
}

export function StatusPill({ status }: { status: string }) {
	return (
		<Badge tone={TONE[status] ?? "neutral"} srLabel={LABEL[status] ?? status}>
			{LABEL[status] ?? status}
		</Badge>
	)
}
