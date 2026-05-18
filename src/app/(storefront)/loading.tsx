import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
	return (
		<main className="mx-auto max-w-6xl px-6 py-12">
			<Skeleton className="h-9 w-48" />
			<div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
				{Array.from({ length: 8 }).map((_, i) => (
					<div key={i} className="space-y-2">
						<Skeleton className="aspect-square w-full rounded-xl" />
						<Skeleton className="h-4 w-3/4" />
						<Skeleton className="h-4 w-1/3" />
					</div>
				))}
			</div>
		</main>
	)
}
