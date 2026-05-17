import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth-guards"
import { presignProductImageUpload, MAX_BYTES } from "@/lib/r2/presign"
import { productImageKey } from "@/lib/r2/key"

const Body = z.object({
	productId: z.string().uuid(),
	filename: z.string().min(1).max(200),
	contentType: z.string().min(1),
	contentLength: z.number().int().positive().max(MAX_BYTES),
})

export async function POST(request: Request) {
	await requireAdmin()
	const json = await request.json().catch(() => null)
	const parsed = Body.safeParse(json)
	if (!parsed.success) {
		return NextResponse.json({ error: "invalid_payload" }, { status: 400 })
	}
	const { productId, filename, contentType, contentLength } = parsed.data
	try {
		const key = productImageKey(productId, filename)
		const { uploadUrl, publicUrl } = await presignProductImageUpload({
			key,
			contentType,
			contentLength,
		})
		return NextResponse.json({ key, uploadUrl, publicUrl })
	} catch (err) {
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "presign_failed" },
			{ status: 400 },
		)
	}
}
