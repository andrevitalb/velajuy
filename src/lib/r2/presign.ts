import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { r2 } from "./client"
import { env } from "@/lib/env"

export const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"]

export async function presignProductImageUpload({
	key,
	contentType,
	contentLength,
}: {
	key: string
	contentType: string
	contentLength: number
}): Promise<{ uploadUrl: string; publicUrl: string }> {
	if (!ALLOWED_TYPES.includes(contentType)) {
		throw new Error(`Unsupported content-type: ${contentType}`)
	}
	if (contentLength > MAX_BYTES) {
		throw new Error(`File too large: ${contentLength} > ${MAX_BYTES}`)
	}
	const command = new PutObjectCommand({
		Bucket: env.R2_BUCKET,
		Key: key,
		ContentType: contentType,
		ContentLength: contentLength,
	})
	const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 60 })
	return { uploadUrl, publicUrl: `${env.R2_PUBLIC_URL}/${key}` }
}
