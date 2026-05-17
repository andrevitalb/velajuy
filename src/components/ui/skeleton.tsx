import { cn } from "@/lib/cn"

export function Skeleton({ className }: { className?: string }) {
	return (
		<div
			role="status"
			aria-label="Cargando"
			className={cn("animate-pulse-soft rounded-md bg-velajuy-pink-soft", className)}
		/>
	)
}

export function ProductCardSkeleton() {
	return (
		<div className="space-y-2">
			<Skeleton className="aspect-square w-full rounded-xl" />
			<Skeleton className="h-4 w-3/4" />
			<Skeleton className="h-4 w-1/3" />
		</div>
	)
}

export function ProductDetailSkeleton() {
	return (
		<div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 md:grid-cols-[1fr_1fr]">
			<Skeleton className="aspect-square w-full rounded-2xl" />
			<div className="space-y-4">
				<Skeleton className="h-8 w-3/4" />
				<Skeleton className="h-6 w-1/3" />
				<Skeleton className="h-24 w-full" />
				<Skeleton className="h-12 w-40" />
			</div>
		</div>
	)
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
	return (
		<tr>
			{Array.from({ length: cols }).map((_, i) => (
				<td key={i} className="px-3 py-3">
					<Skeleton className="h-4 w-full" />
				</td>
			))}
		</tr>
	)
}
