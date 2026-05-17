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
			<span className={className}>
				{amount} {currency}
			</span>
		)
	}
	return <span className={className}>{formatCOP(amount)}</span>
}
