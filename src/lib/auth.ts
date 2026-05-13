import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { magicLink } from "better-auth/plugins"
import { db } from "@/lib/db"
import { env } from "@/lib/env"
import { users, sessions, accounts, verifications } from "@/lib/db/schema"

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		usePlural: true,
		schema: {
			users,
			sessions,
			accounts,
			verifications,
		},
	}),
	baseURL: env.BETTER_AUTH_URL,
	secret: env.BETTER_AUTH_SECRET,
	advanced: {
		database: { generateId: "uuid" },
	},
	user: {
		additionalFields: {
			role: { type: "string", defaultValue: "customer", input: false },
			phone: { type: "string", required: false },
		},
	},
	plugins: [
		magicLink({
			sendMagicLink: async ({ email, url }) => {
				console.log(`[magic-link] ${email} → ${url}`)
			},
		}),
	],
})

export type Session = typeof auth.$Infer.Session
