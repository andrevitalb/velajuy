/** Returns `redirect` only if it's a same-origin path. Falls back to `fallback`. */
export function safeRedirect(redirect: string | null | undefined, fallback: string): string {
	if (!redirect) return fallback
	if (!redirect.startsWith("/")) return fallback
	if (redirect.startsWith("//")) return fallback
	return redirect
}
