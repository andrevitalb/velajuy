import { nanoid } from "nanoid"

export function productImageKey(productId: string, filename: string): string {
	const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg"
	if (!["jpg", "jpeg", "png", "webp", "avif"].includes(ext)) {
		throw new Error(`Unsupported extension: ${ext}`)
	}
	return `products/${productId}/${nanoid(12)}.${ext}`
}
