import { randomBytes } from "node:crypto"

export function newUnsubscribeToken(): string {
	return randomBytes(24).toString("base64url")
}
