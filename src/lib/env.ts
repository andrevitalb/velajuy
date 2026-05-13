import { z } from "zod"

const schema = z.object({
	DATABASE_URL: z.string().url(),
	BETTER_AUTH_SECRET: z.string().min(32),
	BETTER_AUTH_URL: z.string().url(),
	NEXT_PUBLIC_APP_URL: z.string().url(),
	NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
	const issues = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n")
	throw new Error(`Invalid environment variables:\n${issues}`)
}

export const env = parsed.data
