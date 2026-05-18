import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { env } from "@/lib/env"
import * as schema from "./schema"

// Reuse the postgres client across Next.js hot reloads in dev. Without this,
// every module re-evaluation spawns a new pool and the old connections never
// close, eventually hitting Postgres's `max_connections` ("53300 sorry, too
// many clients already").
const globalForDb = globalThis as unknown as {
	__velajuy_pg_client?: ReturnType<typeof postgres>
}

const queryClient =
	globalForDb.__velajuy_pg_client ??
	postgres(env.DATABASE_URL, {
		prepare: false,
		max: 10,
		idle_timeout: 20,
	})

if (process.env.NODE_ENV !== "production") {
	globalForDb.__velajuy_pg_client = queryClient
}

export const db = drizzle(queryClient, { schema, casing: "snake_case" })
export type DB = typeof db
