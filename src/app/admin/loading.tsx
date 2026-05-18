import { Skeleton, TableRowSkeleton } from "@/components/ui/skeleton"

export default function Loading() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-8 w-64" />
			<div className="rounded-xl border border-velajuy-wine/10 bg-white p-4">
				<Skeleton className="mb-4 h-6 w-32" />
				<table className="w-full">
					<tbody>
						{Array.from({ length: 6 }).map((_, i) => (
							<TableRowSkeleton key={i} cols={5} />
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}
