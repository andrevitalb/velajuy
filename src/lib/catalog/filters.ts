export type Sort = "nuevas" | "precio-asc" | "precio-desc"

export type CatalogFilters = {
	color: string[]
	largo: string[]
	estilo: string[]
	disponible: boolean
	sort: Sort
}

const SORTS: Sort[] = ["nuevas", "precio-asc", "precio-desc"]

function asArray(v: string | string[] | undefined): string[] {
	if (v == null) return []
	return Array.isArray(v) ? v : [v]
}

export function filtersFromSearchParams(
	params: Record<string, string | string[] | undefined>,
): CatalogFilters {
	const sort = SORTS.includes(params.sort as Sort) ? (params.sort as Sort) : "nuevas"
	return {
		color: asArray(params.color),
		largo: asArray(params.largo),
		estilo: asArray(params.estilo),
		disponible: params.disponible === "1",
		sort,
	}
}

export function filtersToSearchString(f: CatalogFilters): string {
	const parts: string[] = []
	for (const slug of f.color) parts.push(`color=${encodeURIComponent(slug)}`)
	for (const slug of f.largo) parts.push(`largo=${encodeURIComponent(slug)}`)
	for (const slug of f.estilo) parts.push(`estilo=${encodeURIComponent(slug)}`)
	if (f.disponible) parts.push("disponible=1")
	if (f.sort !== "nuevas") parts.push(`sort=${f.sort}`)
	return parts.join("&")
}
