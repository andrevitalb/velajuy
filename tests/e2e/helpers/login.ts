import { randomBytes, webcrypto } from "node:crypto"
import postgres from "postgres"
import type { BrowserContext } from "@playwright/test"

const SESSION_DAYS = 7

/**
 * Signs a cookie value the same way better-auth does (HMAC-SHA-256 + base64,
 * appended as `${value}.${signature}`, then URL-encoded). Verified against
 * `node_modules/better-call/dist/crypto.mjs::signCookieValue`.
 */
async function signCookieValue(value: string, secret: string): Promise<string> {
	const key = await webcrypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	)
	const sigBuf = await webcrypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))
	const sigB64 = Buffer.from(sigBuf).toString("base64")
	return encodeURIComponent(`${value}.${sigB64}`)
}

/**
 * Inserts a `sessions` row for the seeded owner user and sets the better-auth
 * session cookie (signed) on the Playwright context.
 *
 * Cookie name: `better-auth.session_token` — confirmed from
 * `node_modules/better-auth/dist/cookies/index.mjs` (createCookie uses prefix
 * `better-auth` + cookieName `session_token`).
 */
export async function loginAsOwner(context: BrowserContext, baseURL: string) {
	const databaseUrl = process.env.DATABASE_URL
	if (!databaseUrl) throw new Error("DATABASE_URL not set — Playwright cannot log in")
	const secret = process.env.BETTER_AUTH_SECRET
	if (!secret) throw new Error("BETTER_AUTH_SECRET not set — Playwright cannot sign session cookie")

	const sql = postgres(databaseUrl, { prepare: false })
	try {
		const [owner] = await sql<{ id: string }[]>`
			select id from users where email = 'andre.vital@metalab.com' limit 1
		`
		if (!owner) throw new Error("Owner not seeded — run pnpm db:seed")
		// Clear any leftover wishlist rows so tests start from a known state.
		await sql`delete from wishlist_items where user_id = ${owner.id}`
		const token = randomBytes(32).toString("base64url")
		const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
		await sql`
			insert into sessions (user_id, token, expires_at)
			values (${owner.id}, ${token}, ${expiresAt})
		`
		const signed = await signCookieValue(token, secret)
		const url = new URL(baseURL)
		await context.addCookies([
			{
				name: "better-auth.session_token",
				value: signed,
				domain: url.hostname,
				path: "/",
				httpOnly: true,
				secure: url.protocol === "https:",
				sameSite: "Lax",
				expires: Math.floor(expiresAt.getTime() / 1000),
			},
		])
	} finally {
		await sql.end()
	}
}
