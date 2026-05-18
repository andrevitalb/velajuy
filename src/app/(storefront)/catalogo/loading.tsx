import { ProductCardSkeleton, Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
	return (
		<main className="mx-auto max-w-6xl px-6 py-12">
			<header className="flex items-end justify-between">
				<Skeleton className="h-9 w-40" />
				<Skeleton className="h-9 w-32" />
			</header>
			<div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[16rem_1fr]">
				<aside className="hidden space-y-4 lg:block">
					<Skeleton className="h-5 w-24" />
					<Skeleton className="h-32 w-full" />
					<Skeleton className="h-5 w-24" />
					<Skeleton className="h-32 w-full" />
				</aside>
				<ul className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
					{Array.from({ length: 8 }).map((_, i) => (
						<li key={i}>
							<ProductCardSkeleton />
						</li>
					))}
				</ul>
			</div>
		</main>
	)
}
