import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { magicLink } from "better-auth/plugins"
import { db } from "@/lib/db"
import { users, sessions, accounts, verifications } from "@/lib/db/schema"
import { sendEmail } from "@/lib/email/client"
import { magicLinkEmail } from "@/lib/email/templates/magic-link"
import { env } from "@/lib/env"

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		usePlural: true,
		// usePlural alone misses "verifications" in our schema — explicit map required.
		schema: {
			users,
			sessions,
			accounts,
			verifications,
		},
	}),
	baseURL: env.BETTER_AUTH_URL,
	secret: env.BETTER_AUTH_SECRET,
	emailAndPassword: {
		enabled: true,
		autoSignIn: false,
		minPasswordLength: 8,
	},
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
				const { subject, html, text } = magicLinkEmail({ email, url })
				await sendEmail({ to: email, subject, html, text })
			},
		}),
	],
})

export type Session = typeof auth.$Infer.Session
