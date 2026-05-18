import { cn } from "@/lib/cn"
import { formatCOP } from "@/lib/money"

export function Price({
	amount,
	currency = "COP",
	className,
}: {
	amount: number
	currency?: string
	className?: string
}) {
	if (currency !== "COP") {
		return (
			<span className={cn(className, "tabular-nums")}>
				{amount} {currency}
			</span>
		)
	}
	return <span className={cn(className, "tabular-nums")}>{formatCOP(amount)}</span>
}
