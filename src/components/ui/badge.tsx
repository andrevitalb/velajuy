import { AlertCircle, CheckCircle2, CircleDashed, Clock, Info, XCircle } from "lucide-react"
import { cn } from "@/lib/cn"

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger" | "pending"

const TONE_STYLES: Record<
	BadgeTone,
	{ bg: string; fg: string; Icon: React.ComponentType<{ className?: string }> }
> = {
	neutral: { bg: "bg-velajuy-pink-soft", fg: "text-velajuy-wine", Icon: CircleDashed },
	info: { bg: "bg-blue-50", fg: "text-blue-800", Icon: Info },
	success: { bg: "bg-emerald-50", fg: "text-emerald-800", Icon: CheckCircle2 },
	warning: { bg: "bg-amber-50", fg: "text-amber-900", Icon: AlertCircle },
	danger: { bg: "bg-rose-50", fg: "text-rose-900", Icon: XCircle },
	pending: { bg: "bg-velajuy-pink-soft", fg: "text-velajuy-wine", Icon: Clock },
}

export function Badge({
	tone = "neutral",
	children,
	srLabel,
	className,
	pulse,
}: {
	tone?: BadgeTone
	children: React.ReactNode
	srLabel?: string
	className?: string
	pulse?: boolean
}) {
	const { bg, fg, Icon } = TONE_STYLES[tone]
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
				bg,
				fg,
				pulse && "animate-pulse-soft",
				className,
			)}
		>
			<Icon aria-hidden="true" className="size-3" />
			{srLabel && <span className="sr-only">{srLabel}</span>}
			{children}
		</span>
	)
}
