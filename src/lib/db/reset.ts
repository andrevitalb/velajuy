import postgres from "postgres"
import { env } from "@/lib/env"

async function main() {
	const sql = postgres(env.DATABASE_URL, { max: 1 })
	try {
		await sql`DROP SCHEMA IF EXISTS public CASCADE`
		await sql`DROP SCHEMA IF EXISTS drizzle CASCADE`
		await sql`CREATE SCHEMA public`
		await sql`GRANT ALL ON SCHEMA public TO public`
		console.log("Schema reset complete.")
	} finally {
		await sql.end()
	}
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})
