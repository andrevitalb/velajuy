import { defineConfig, devices } from "@playwright/test"
import dotenv from "dotenv"

// Load env so the test runner (which talks to Postgres directly for the
// loginAsOwner helper) can read DATABASE_URL and BETTER_AUTH_SECRET.
dotenv.config({ path: ".env.local" })

export default defineConfig({
	testDir: "./tests/e2e",
	fullyParallel: false,
	retries: 0,
	use: {
		baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
		trace: "on-first-retry",
	},
	projects: [{ name: "chromium", use: devices["Desktop Chrome"] }],
	webServer: {
		command: "pnpm dev",
		url: "http://localhost:3000",
		reuseExistingServer: true,
		timeout: 60_000,
	},
})
